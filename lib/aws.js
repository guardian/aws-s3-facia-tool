var AWS = require('aws-sdk');
var s3 = new AWS.S3();
var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

var cacheEnabled = false;

exports.setCache = function (bool) {
    cacheEnabled = !!bool;
}

exports.getObject = function (object, callback) {
    object.ResponseContentType = 'application/json';

    var filename = path.join(__dirname, '/../tmp/', object.Key.replace(/[\/:@]/g, '_'));
    if (cacheEnabled) {
        if (fs.existsSync(filename)) {
            var content = fs.readFileSync(filename);

            return callback(null, JSON.parse(content.toString()));
        }
    }

    // Couldn't find in cache
    s3.getObject(object, function (err, data) {
        if (!err) {
            var body = data.Body.toString();
            if (cacheEnabled) {
                mkdirp.sync(path.dirname(filename));
                fs.writeFileSync(filename, body);
            }
            data = JSON.parse(body);
        }
        callback(err, data);
    });
};

exports.listObjects = function (object, callback) {
    var filename = path.join(__dirname, '/../tmp/list/', object.Prefix.replace(/[\/:@]/g, '_'));
    if (cacheEnabled) {
        if (fs.existsSync(filename)) {
            var content = fs.readFileSync(filename);

            return callback(null, JSON.parse(content.toString()));
        }
    }

    // Couldn't find in cache
    var contents = [];
    listTruncatedObject(object, contents, function (err) {
        if (!err) {
            if (cacheEnabled) {
                mkdirp.sync(path.dirname(filename));
                fs.writeFileSync(filename, JSON.stringify(contents, null, '    '));
            }
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
