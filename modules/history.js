import {parallel} from '../lib/series';
import {datesBetween} from '../lib/since';
import {getHistoryConfigPrefix, getHistoryCollectionPrefix} from '../lib/aws-keys';
import {toListOfConfigChanges, toListOfCollectionChanges} from '../lib/aws-transforms';
import findInHistory from '../lib/find-history';
import {default as ToolConfig} from './config';
import {default as ToolCollection} from './collection';

// To be deprecated maybe?
import * as sinceUtil from '../lib/since';
import ListConfigs from '../lib/list-configs';
import Config from '../lib/config';
import Collection from '../lib/collection';
import ListCollections from '../lib/list-collection-history';

export default function (client) {
    function configList (since, to, filter) {
        if (!since || !to) {
            return Promise.reject(
                new Error('Missing or invalid date interval parameters in history.configList')
            );
        } else {
            const options = client.options;
            const maxParallel = options.maxParallelRequests || 4;
            const maxDaysHistory = options.maxDaysHistory || 7;
            const needed = datesBetween(since, to, maxDaysHistory);

            return parallel(needed, (date, callback) => {
                client.AWS.listObjects({
                    Bucket: options.bucket,
                    Prefix: getHistoryConfigPrefix(date, options)
                }, (err, data) => callback(err, err ? null : toListOfConfigChanges(data)));
            }, maxParallel)
            .then(filter ? filter : list => list);
        }
    }

    function collectionList (since, to, collectionId, filter) {
        if (!since || !to) {
            return Promise.reject(
                new Error('Missing or invalid date interval parameters in history.collectionList')
            );
        } else if (!collectionId) {
            return Promise.reject(
                new Error('Missing collection ID in history.collectionList')
            );
        } else {
            const options = client.options;
            const maxParallel = options.maxParallelRequests || 4;
            const maxDaysHistory = options.maxDaysHistory || 7;
            const needed = datesBetween(since, to, maxDaysHistory);

            return parallel(needed, (date, callback) => {
                client.AWS.listObjects({
                    Bucket: options.bucket,
                    Prefix: getHistoryCollectionPrefix(collectionId, date, options)
                }, (err, data) => callback(err, err ? null : toListOfCollectionChanges(data)));
            }, maxParallel)
            .then(filter ? filter : list => list);
        }
    }

    function configAt (time) {
        if (!time) {
            return Promise.reject(
                new Error('Missing parameter \'time\' in history.configAt')
            );
        } else {
            return findInHistory(time, getHistoryConfigPrefix, client.options, client.AWS)
            .then(object => ToolConfig(client).fetchAt(object.Key))
            .catch(ex => {
                ex.message += ' while fetching the config';
                return Promise.reject(ex);
            });
        }
    }

    function collectionAt (id, time, config = {}) {
        if (!id) {
            return Promise.reject(
                new Error('Missing parameter \'id\' in history.collectionAt')
            );
        } else if (!time) {
            return Promise.reject(
                new Error('Missing parameter \'time\' in history.collectionAt')
            );
        } else {
            const prefix = (date, options) => getHistoryCollectionPrefix(id, date, options);
            return findInHistory(time, prefix, client.options, client.AWS)
            .then(object => ToolCollection(client).fetchAt(id, object.Key, config))
            .catch(ex => {
                ex.message += ' while fetching the collection \'' + id + '\'';
                return Promise.reject(ex);
            });
        }
    }

    function frontAt (id, time, onCollectionFail) {
        if (!id) {
            return Promise.reject(
                new Error('Missing parameter \'id\' in history.frontAt')
            );
        } else if (!time) {
            return Promise.reject(
                new Error('Missing parameter \'time\' in history.frontAt')
            );
        } else {
            return configAt(time).then(config => {
                if (config.hasFront(id)) {
                    const front = config.front(id);
                    const maxParallel = client.options.maxParallelRequests || 4;
                    return parallel(front.listCollectionsIds(), (collectionId, callback) => {
                        collectionAt(collectionId, time, config)
                        .then(collection => {
                            front.setCollection(collectionId, collection);
                            callback(null);
                        })
                        .catch(onCollectionFail ?
                            ex => onCollectionFail(collectionId, ex, callback) :
                            callback
                        );
                    }, maxParallel)
                    .then(() => front);
                } else {
                    return Promise.reject(new Error('Front \'' + id + '\' did not exists at the specified time.'));
                }
            });
        }
    }

    function config (since) {
        console.warn('History.config is deprecated');
        var options = client.options,
            maxParallel = options.maxParallelRequests || 4,
            needed = sinceUtil.needed(since, options.maxDaysHistory),
            configList;

        return parallel(needed, function (date, callback) {
            var configPrefix = getHistoryConfigPrefix(date, options);
            client.AWS.listObjects({
                Bucket: options.bucket,
                Prefix: configPrefix
            }, callback);
        }, maxParallel)
        .then(function (all) {
            var list = new ListConfigs(getHistoryConfigPrefix(null, options), since);
            all.forEach(function (result) {
                list.append(result.json);
            });
            configList = list;
            return list;
        })
        .then(function (list) {
            return parallel(list.all, function (object, callback) {
                client.AWS.getObject({
                    Bucket: options.bucket,
                    Key: object.Key
                }, callback);
            }, maxParallel);
        })
        .then(function (results) {
            configList.all.forEach(function (config, index) {
                config.config = new Config(results[index].json);
            });
            return configList;
        });
    }

    function collection (id, since) {
        console.warn('History.collection is deprecated');
        if (!id) {
            return Promise.reject(new Error('Missing collection id while fetching history'));
        }
        var options = client.options,
            maxParallel = options.maxParallelRequests || 4,
            needed = sinceUtil.needed(since, options.maxDaysHistory),
            collectionList;

        return parallel(needed, function (date, callback) {
            var collectionPrefix = getHistoryCollectionPrefix(id, date, options);
            client.AWS.listObjects({
                Bucket: options.bucket,
                Prefix: collectionPrefix
            }, callback);
        }, maxParallel)
        .then(function (all) {
            var list = new ListCollections(id, since);
            collectionList = list;
            all.forEach(function (result) {
                list.append(result.json);
            });
            return list;
        })
        .then(function (list) {
            return parallel(list.all, function (object, callback) {
                client.AWS.getObject({
                    Bucket: options.bucket,
                    Key: object.Key
                }, callback);
            }, maxParallel);
        })
        .then(function (results) {
            collectionList.all.forEach(function (config, index) {
                config.collection = new Collection(results[index].json);
            });
            return collectionList;
        });
    }

    return {configList, config, collection, collectionList, configAt, collectionAt, frontAt};
}
