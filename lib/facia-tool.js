/**
 * TODO
 * This is not accessible anymore, but I haven't migrated these methods.
 * It's probably fine to deprecate them, but I'll keep them around for a little
 * longer (read: for ever)
 */
import * as aws from './aws';
import async from 'async';
import {parallel} from './series';
import Collection from '../modules/collection';
import Config from '../modules/config';
import History from '../modules/history';
import List from '../modules/list';
import Press from '../modules/press';
import promise from './as-promise';
import Query from './query';
import * as allFilters from './filters';

function FaciaTool (options) {
    this.options = options;

    this.history = History(this, aws);
    this.list = List(this);
    this.press = Press(this, aws);
    this.config = Config(this, aws);
    this.collection = Collection(this, aws);

    this.AWS = aws;
    this.FILTERS = allFilters;
}

FaciaTool.prototype.query = Query;

FaciaTool.prototype.fetchFronts = function (filter) {
    const options = this.options;
    const tool = this;

    return this.config.fetch().then(config => {
        const all = (filter || config.listFrontsIds())
        .filter(id => config.hasFront(id))
        .map(id => config.front(id));

        return promise(cb => {
            async.parallelLimit(all.map(function (front) {
                return function (callback) {
                    fetchSingleFront(config, front, tool)
                    .then(function (fetched) {
                        callback(null, fetched);
                    })
                    .catch(callback);
                };
            }), options.maxParallelRequests || 4, cb);
        });
    });
};

FaciaTool.prototype.fetchCollection = function (id) {
    return this.config.fetch()
        .then(config => this.collection.fetch(id, config));
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
    const tool = this;
    return this.config.fetch().then(function (config) {
        return promise(cb => {
            if (!list) {
                list = Object.keys(config.json.collections);
            }

            async.parallelLimit(list.map(function (object) {
                return function (callback) {
                    tool.collection.fetch(object, config).then(function (collection) {
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

function fetchSingleFront (config, front, tool) {
    const options = tool.options;
    return parallel(front.listCollectionsIds(), function (collectionId, callback) {
        var collection = config.collection(collectionId);
        front.setCollection(collectionId, collection);

        if (collection.config.uneditable) {
            // This collection cannot be pressed
            collection.setContent(null);
            callback();
        } else {
            tool.collection.fetch(collectionId, config)
            .then(function (collection) {
                front.setCollection(collectionId, collection);
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
