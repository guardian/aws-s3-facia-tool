import {parallel} from '../lib/series';
import {datesBetween} from '../lib/since';
import {getHistoryConfigPrefix, getHistoryCollectionPrefix} from '../lib/aws-keys';
import {toListOfConfigChanges, toListOfCollectionChanges} from '../lib/aws-transforms';

// To be deprecated maybe?
import * as sinceUtil from '../lib/since';
import ListConfigs from '../lib/list-configs';
import Config from '../lib/config';
import Collection from '../lib/collection';
import ListCollections from '../lib/list-collection-history';

export default function (tool, aws) {
    function configList (since, to, filter) {
        if (!since || !to) {
            return Promise.reject(
                new Error('Missing or invalid date interval parameters in history.configList')
            );
        } else {
            const maxParallel = tool.options.maxParallelRequests || 4;
            const maxDaysHistory = tool.options.maxDaysHistory || 7;
            const needed = datesBetween(since, to, maxDaysHistory);

            return parallel(needed, (date, callback) => {
                aws.listObjects({
                    Bucket: tool.options.bucket,
                    Prefix: getHistoryConfigPrefix(date, tool.options)
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
            const maxParallel = tool.options.maxParallelRequests || 4;
            const maxDaysHistory = tool.options.maxDaysHistory || 7;
            const needed = datesBetween(since, to, maxDaysHistory);

            return parallel(needed, (date, callback) => {
                aws.listObjects({
                    Bucket: tool.options.bucket,
                    Prefix: getHistoryCollectionPrefix(collectionId, date, tool.options)
                }, (err, data) => callback(err, err ? null : toListOfCollectionChanges(data)));
            }, maxParallel)
            .then(filter ? filter : list => list);
        }
    }

    function config (since) {
        console.warn('History.config is deprecated');
        var options = tool.options,
            maxParallel = options.maxParallelRequests || 4,
            needed = sinceUtil.needed(since, options.maxDaysHistory),
            configList;

        return parallel(needed, function (date, callback) {
            var configPrefix = getHistoryConfigPrefix(date, options);
            aws.listObjects({
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
                aws.getObject({
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
        var options = tool.options,
            maxParallel = options.maxParallelRequests || 4,
            needed = sinceUtil.needed(since, options.maxDaysHistory),
            collectionList;

        return parallel(needed, function (date, callback) {
            var collectionPrefix = getHistoryCollectionPrefix(id, date, options);
            aws.listObjects({
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
                aws.getObject({
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

    return {configList, config, collection, collectionList};
}
