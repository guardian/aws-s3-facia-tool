var aws = require('./aws');
var Promise = require('es6-promise').Promise;
var Config = require('./config');
var Collection = require('./collection');
var ListCollections = require('./list-collections');
var async = require('async');
var series = require('./series');
var History = require('./history');
var Press = require('./press');

function FaciaTool (options) {
    this.options = options;

    this.history = new History(this);

    this.press = new Press(this);
}

FaciaTool.prototype.query = require('./query');

FaciaTool.prototype.fetchConfig = function () {
    var options = this.options;
    return new Promise(function (resolve, reject) {
        aws.getObject({
            Bucket: options.bucket,
            Key: getConfigKey(options)
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(new Config(data));
            }
        });
    });
};

FaciaTool.prototype.front = function (id) {
    var options = this.options;

    return this.fetchConfig().then(function (config) {
        var frontConfig = config.front(id);
        if (!frontConfig.config) {
            throw new Error('Unable to find a front with ID \'' + id + '\'');
        }

        return fetchSingleFront(config, frontConfig, options);
    });
};

FaciaTool.prototype.fetchFronts = function (filter) {
    var options = this.options;

    return this.fetchConfig().then(function (config) {
        var all = (filter || config.listFrontsIds()).filter(function (id) {
            return config.hasFront(id);
        }).map(function (id) {
            return config.front(id);
        });

        return new Promise(function (resolve, reject) {
            async.parallelLimit(all.map(function (front) {
                return function (callback) {
                    fetchSingleFront(config, front, options)
                    .then(function (fetched) {
                        callback(null, fetched);
                    })
                    .catch(callback);
                };
            }), options.maxParallelRequests || 4, function (err, fronts) {
                if (err) {
                    reject(err);
                } else {
                    resolve(fronts);
                }
            });
        });
    });
};

FaciaTool.prototype.listCollections = function () {
    var options = this.options;
    return new Promise(function (resolve, reject) {
        var collectionsPrefix = getCollectionsPrefix(options);
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: collectionsPrefix
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(new ListCollections(collectionsPrefix, data));
            }
        });
    });
};

FaciaTool.prototype.fetchCollection = function (id) {
    var options = this.options;
    var key = getCollectionKey(id, options);

    return Promise.all([
        this.fetchConfig(),
        fetchSingleCollection(key, options)
    ]).then(function (results) {
        var collection = results[0].collection(id);
        collection.setKey(key);
        collection.setContent(results[1]);
        return collection;
    });
};

FaciaTool.prototype.fetchCollections = function (list, filter) {
    var options = this.options;

    if (filter) {
        list = list.filter(filter);
    }
    return this.fetchConfig().then(function (config) {
        return new Promise(function (resolve, reject) {
            async.parallelLimit(list.all.map(function (object) {
                return function (callback) {
                    aws.getObject({
                        Bucket: options.bucket,
                        Key: object.Key
                    }, function (err, data) {
                        if (!err) {
                            data = {
                                object: object,
                                json: data
                            };
                        }
                        callback(err, data);
                    });
                };
            }), options.maxParallelRequests || 4, function (err, results) {
                if (err) {
                    reject(err);
                } else {
                    resolve(results.map(function (result) {
                        var collection = config.collection(result.object.id);
                        collection.setKey(result.object.Key);
                        collection.setContent(result.json);
                        return collection;
                    }));
                }
            });
        });
    });
};

FaciaTool.prototype.findCollections = function (list, progressCallback) {
    var options = this.options;
    return this.fetchConfig().then(function (config) {
        return new Promise(function (resolve, reject) {
            if (!list) {
                list = Object.keys(config.json.collections);
            }

            async.parallelLimit(list.map(function (object) {
                var key = getCollectionKey(object, options);
                return function (callback) {
                    fetchSingleCollection(key, options).then(function (content) {
                        var collection = config.collection(object);
                        collection.setKey(key);
                        collection.setContent(content);
                        if (progressCallback) {
                            progressCallback(collection);
                        }
                        callback(null, collection);
                    })
                    .catch(function () {
                        // Ignore errors, the collection might exist but it was never pressed
                        callback();
                    });
                };
            }), options.maxParallelRequests || 4, function (err, collections) {
                if (err) {
                    reject(err);
                } else {
                    resolve(collections.filter(function (collection) {
                        return !!collection;
                    }));
                }
            });
        });
    });
};

function getConfigKey (options) {
    return [
        options.env,
        options.configKey
    ].join('/');
}

function getCollectionsPrefix (options) {
    return [
        options.env,
        options.collectionsPrefix
    ].join('/');
}

function getCollectionKey (id, options) {
    return [
        getCollectionsPrefix(options),
        id,
        'collection.json'
    ].join('/');
}

function fetchSingleCollection (key, options) {
    return new Promise(function (resolve, reject) {
        aws.getObject({
            Bucket: options.bucket,
            Key: key
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

function fetchSingleFront (config, front, options) {
    return series.parallel(front.allCollections(), function (collectionId, callback) {
        var key = getCollectionKey(collectionId, options);
        var collection = new Collection(collectionId, config.json);
        front.setCollection(collectionId, collection);

        if (collection.config.uneditable) {
            // This collection cannot be pressed
            collection.setContent(null);
            callback();
        } else {
            fetchSingleCollection(key, options)
            .then(function (content) {
                collection.setContent(content);
                callback();
            })
            .catch(function () {
                // Ignore errors, maybe the collection was never pressed?
                collection.setContent(null);
                callback();
            });
        }
    }, options.maxParallelRequests || 4)
    .then(function () {
        return front;
    });
}

module.exports = FaciaTool;
