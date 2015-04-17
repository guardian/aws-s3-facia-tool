/* globals Promise:true */
var aws = require('./aws');
var Promise = require('es6-promise').Promise;
var Config = require('./config');
var Collection = require('./collection');
var Front = require('./front');
var ListCollections = require('./list-collections');
var ListConfigs = require('./list-configs');
var async = require('async');
var moment = require('moment');

function FaciaTool (options) {
    this.options = options;
    // Current config
    this.config = null;
    // Current list of collections
    this.list = null;
    this.pastConfigs = null;
    // Last selected front
    this.lastFront = null;
}

FaciaTool.prototype.fetchConfig = function () {
    var options = this.options,
        that = this;
    return new Promise(function (resolve, reject) {
        aws.getObject({
            Bucket: options.bucket,
            Key: getConfigKey(options)
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                that.config = new Config(data);
                resolve(that.config);
            }
        });
    });
};

FaciaTool.prototype.historyConfig = function (since) {
    var options = this.options,
        that = this;
    return new Promise(function (resolve, reject) {
        var configPrefix = getHistoryConfigPrefix(options);
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: configPrefix,
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                var list = that.pastConfigs = new ListConfigs(configPrefix, since, data);
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
    var that = this;
    return Promise.all([
        this.fetchConfig(),
        this.historyConfig(details.since)
    ]).then(function (results) {
        that.lastFront = new Front(details.front, results[0], results[1]);
        return that.lastFront;
    });
};

FaciaTool.prototype.listCollections = function () {
    var options = this.options,
        that = this;
    return new Promise(function (resolve, reject) {
        var collectionsPrefix = getCollectionsPrefix(options)
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: collectionsPrefix
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                that.list = new ListCollections(collectionsPrefix, data);
                resolve(that.list);
            }
        });
    });
};

FaciaTool.prototype.fetchCollection = function (id) {
    var options = this.options;

    return new Promise(function (resolve, reject) {
        var key = [
            getCollectionsPrefix(options),
            id,
            'collection.json'
        ].join('/');

        aws.getObject({
            Bucket: options.bucket,
            Key: key
        }, function (err, data) {
            if (err) {
                reject(err);
            } else {
                resolve(new Collection({
                    object: {
                        id: id
                    },
                    json: data
                }));
            }
        });
    });
};

FaciaTool.prototype.fetchCollections = function (filter) {
    var list = this.list,
        options = this.options;

    if (filter) {
        list = list.filter(filter);
    }
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
                resolve(results.map(function (collection) {
                    return new Collection(collection);
                }));
            }
        });
    });
};

FaciaTool.prototype.findCollections = function (list) {
    var options = this.options,
        tool = this;

    return new Promise(function (resolve, reject) {
        async.parallelLimit(list.map(function (object) {
            return function (callback) {
                tool.fetchCollection(object).then(function (collection) {
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

module.exports = FaciaTool;
