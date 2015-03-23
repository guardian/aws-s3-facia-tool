var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var cache = require('./cache');

exports.setCache = function (bool) {
    cache.cacheEnabled = !!bool;
}
exports.setS3 = function (object) {
    s3 = object;
}

exports.getObject = function (object, callback) {
    var inCache = cache.key(object.Key),
        cachedContent = inCache.get();
    if (cachedContent) {
        return callback(null, cachedContent);
    }

    object.ResponseContentType = 'application/json';
    s3.getObject(object, function (err, data) {
        if (!err) {
            var body = data.Body.toString();
            inCache.store(body);
            data = JSON.parse(body);
        }
        callback(err, data);
    });
};

exports.listObjects = function (object, callback) {
    var inCache = cache.key(object.Prefix),
        cachedContent = inCache.get();
    if (cachedContent) {
        return callback(null, cachedContent);
    }

    var contents = [];
    listTruncatedObject(object, contents, function (err) {
        if (!err) {
            inCache.store(JSON.stringify(contents, null, '    '));
        }
        callback(err, contents);
    });
};

function listTruncatedObject (object, contents, callback) {
    object.MaxKeys = 10000;
    s3.listObjects(object, function (err, data) {
        if (!err) {
            contents.push.apply(contents, data.Contents);
            if (data.IsTruncated) {
                object.Marker = data.Contents[data.Contents.length - 1].Key;
                return listTruncatedObject(object, contents, callback);
            }
        }
        callback(err);
    });
}
