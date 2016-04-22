var aws = require('./aws');
var ListConfigs = require('./list-configs');
var ListCollections = require('./list-collection-history');
var series = require('./series');
var Config = require('./config');
var Collection = require('./collection');
var sinceUtil = require('./since');

function History (tool) {
    this.options = tool.options;
}

History.prototype.config = function (since) {
    var options = this.options,
        maxParallel = options.maxParallelRequests || 4,
        needed = sinceUtil.needed(since, options.maxDaysHistory),
        configList;

    return series.parallel(needed, function (date, callback) {
        var configPrefix = getHistoryConfigPrefix(options, date);
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: configPrefix
        }, callback);
    }, maxParallel)
    .then(function (all) {
        var list = new ListConfigs(getHistoryConfigPrefix(options), since);
        all.forEach(function (result) {
            list.append(result.json);
        });
        configList = list;
        return list;
    })
    .then(function (list) {
        return series.parallel(list.all, function (object, callback) {
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
};

History.prototype.collection = function (id, since) {
    if (!id) {
        return Promise.reject(new Error('Missing collection id while fetching history'));
    }
    var options = this.options,
        maxParallel = options.maxParallelRequests || 4,
        needed = sinceUtil.needed(since, options.maxDaysHistory),
        collectionList;

    return series.parallel(needed, function (date, callback) {
        var collectionPrefix = getHistoryCollectionPrefix(options, id, date);
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
        return series.parallel(list.all, function (object, callback) {
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
};

function getHistoryConfigPrefix (options, date) {
    return [
        options.env,
        options.configHistoryPrefix,
        date,
        ''
    ].join('/');
}

function getHistoryCollectionPrefix (options, collection, date) {
    return [
        options.env,
        options.collectionHistoryPrefix,
        date,
        collection,
        ''
    ].join('/');
}

module.exports = History;
