import aws from './aws';
import Collection from './collection';
import ListCollections from './list-collections';
import async from 'async';
import {parallel} from './series';
import Press from './press';
import Config from '../modules/config';
import History from '../modules/history';
import promise from './as-promise';
import {collectionsPrefix, collectionKey} from '../lib/aws-keys';
import Query from './query';
import * as allFilters from './filters';

function FaciaTool (options) {
    this.options = options;

    this.history = History(this, aws);

    this.press = new Press(this);

    this.config = Config(this, aws);

    this.AWS = aws;
    this.FILTERS = allFilters;
}

FaciaTool.prototype.query = Query;

FaciaTool.prototype.fetchConfig = function () {
    console.log('tool.fetchConfig is deprecated, please use tool.config.fetch()');
    return this.config.fetch();
};

FaciaTool.prototype.front = function (id) {
    const options = this.options;

    return this.config.fetch().then(config => {
        if (config.hasFront(id)) {
            return fetchSingleFront(config, config.front(id), options);
        } else {
            return Promise.reject(new Error('Unable to find a front with ID \'' + id + '\''));
        }
    });
};

FaciaTool.prototype.fetchFronts = function (filter) {
    const options = this.options;

    return this.config.fetch().then(config => {
        const all = (filter || config.listFrontsIds())
        .filter(id => config.hasFront(id))
        .map(id => config.front(id));

        return promise(cb => {
            async.parallelLimit(all.map(function (front) {
                return function (callback) {
                    fetchSingleFront(config, front, options)
                    .then(function (fetched) {
                        callback(null, fetched);
                    })
                    .catch(callback);
                };
            }), options.maxParallelRequests || 4, cb);
        });
    });
};

FaciaTool.prototype.listCollections = function () {
    const options = this.options;
    const prefix = collectionsPrefix(options);

    return promise(cb => {
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: prefix
        }, cb);
    })
    .then(data => new ListCollections(prefix, data));
};

FaciaTool.prototype.fetchCollection = function (id) {
    const options = this.options;
    const key = collectionKey(id, options);

    return Promise.all([
        this.config.fetch(),
        fetchSingleCollection(key, options)
    ]).then(([config, content]) => {
        const collection = config.collection(id);
        collection.setKey(key);
        collection.setContent(content);
        return collection;
    });
};

FaciaTool.prototype.fetchCollections = function (list, filter) {
    const options = this.options;

    if (filter) {
        list = list.filter(filter);
    }
    return this.config.fetch().then(function (config) {
        return promise(cb => {
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
            }), options.maxParallelRequests || 4, cb);
        })
        .then(results => {
            return results.map(result => {
                var collection = config.collection(result.object.id);
                collection.setKey(result.object.Key);
                collection.setContent(result.json);
                return collection;
            });
        });
    });
};

FaciaTool.prototype.findCollections = function (list, progressCallback) {
    const options = this.options;
    return this.config.fetch().then(function (config) {
        return promise(cb => {
            if (!list) {
                list = Object.keys(config.json.collections);
            }

            async.parallelLimit(list.map(function (object) {
                var key = collectionKey(object, options);
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
            }), options.maxParallelRequests || 4, cb);
        })
        .then(collections => {
            return collections.filter(Boolean);
        });
    });
};

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
    return parallel(front.allCollections(), function (collectionId, callback) {
        var key = collectionKey(collectionId, options);
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

export default FaciaTool;
