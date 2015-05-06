/* globals Promise:true */
var aws = require('./aws');
var Promise = require('es6-promise').Promise;
var Config = require('./config');
var ListCollections = require('./list-collections');
var ListConfigs = require('./list-configs');
var async = require('async');
var moment = require('moment');

function FaciaTool (options) {
    this.options = options;
}

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

FaciaTool.prototype.historyConfig = function (since) {
    var options = this.options;
    return new Promise(function (resolve, reject) {
        var configPrefix = getHistoryConfigPrefix(options);
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: configPrefix,
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                var list = new ListConfigs(configPrefix, since, data);
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
                    }
                }), options.maxParallelRequests || 4, function (err, results) {
                    if (err) {
                        reject(err);
                    } else {
                        list.all.forEach(function (config, index) {
                            config.config = new Config(results[index].json);
                        });
                        resolve(list);
                    }
                });
            }
        });
    });
};

FaciaTool.prototype.front = function (details) {
    return Promise.all([
        this.fetchConfig(),
        this.historyConfig(details.since)
    ]).then(function (results) {
        return results[0].front(details.front);
    });
};

FaciaTool.prototype.listCollections = function () {
    var options = this.options;
    return new Promise(function (resolve, reject) {
        var collectionsPrefix = getCollectionsPrefix(options)
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
    })
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
                }
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

FaciaTool.prototype.findCollections = function (list) {
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
                        callback(null, collection);
                    })
                    .catch(function () {
                        // Ignore errors, the collection might exist but it was never pressed
                        callback();
                    });
                }
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

FaciaTool.prototype.historyCollection = function (id, since) {
    var options = this.options;

    return new Promise(function (resolve, reject) {
        var needed, allResults = [];
        if (since) {
            needed = getDates(since);
        } else {
            needed = [moment().format('YYYY/MM/DD')];
        }

        needed = needed.map(function (date) {
            return function (complete) {
                var collectionPrefix = getHistoryCollectionPrefix(options, id, date);

                aws.listObjects({
                    Bucket: options.bucket,
                    Prefix: collectionPrefix,
                }, function (err, data) {
                    if (!err) {
                        // TODO do something with data?
                        // this is a list of collections, get them?
                        allResults.push(data);
                    }
                    complete(err, data);
                });
            };
        });

        async.parallelLimit(needed, options.maxParallelRequests || 4, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(allResults);
            }
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

function getHistoryConfigPrefix (options) {
    return [
        options.env,
        options.configHistoryPrefix
    ].join('/');
}

function getHistoryCollectionPrefix (options, collection, date) {
    return [
        options.env,
        options.collectionHistoryPrefix,
        collection,
        date
    ].join('/');
}

function getDates (date) {
    var needed = [],
        running = moment(date),
        now = moment();

    for (var i = 0; !running.isAfter(now, 'day'); i += 1) {
        needed.push(running.format('YYYY/MM/DD'));
        running.add(1, 'day');
    }
    return needed;
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

module.exports = FaciaTool;
