/* globals Promise:true */
var aws = require('./aws');
var Promise = require('es6-promise').Promise;
var Config = require('./config');
var Collection = require('./collection');
var ListCollections = require('./list-collections');
var async = require('async');

function FaciaTool (options) {
    this.options = options;
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
        })
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

module.exports = FaciaTool;
