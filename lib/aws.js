import AWS from 'aws-sdk';
import createCache from './cache';

export default function (credentialsProvider) {
    let s3, cache = createCache();
    if (credentialsProvider) {
        s3 = new AWS.S3({
            credentials: null,
            credentialsProvider: credentialsProvider
        });
    } else {
        s3 = new AWS.S3();
    }

    function setCache (bool) {
        cache.setEnabled(bool);
    }
    function setS3 (object) {
        s3 = object;
    }

    function getObject (object, callback) {
        const inCache = cache.key(object.Key);
        const cachedContent = inCache.get();
        if (cachedContent) {
            return callback(null, cachedContent);
        }

        object.ResponseContentType = 'application/json';
        s3.getObject(object, function (err, data) {
            if (!err) {
                const body = data.Body.toString();
                inCache.store(body);
                data = JSON.parse(body);
            }
            callback(err, data);
        });
    }

    function headObject (object, callback) {
        const inCache = cache.key(object.Key);
        const cachedContent = inCache.get();
        if (cachedContent) {
            return callback(null, cachedContent);
        }

        s3.headObject(object, function (err, data) {
            if (!err) {
                inCache.store(JSON.stringify(data));
            }

            callback(err, data);
        });
    }

    function listObjects (object, callback) {
        const inCache = cache.key(object.Prefix);
        const cachedContent = inCache.get();
        if (cachedContent) {
            return callback(null, cachedContent);
        }

        listTruncatedObject('listObjectsV2', 'Contents', 'NextContinuationToken', 'ContinuationToken',
            object, [], function (err, contents) {
            if (!err) {
                inCache.store(JSON.stringify(contents));
            }
            callback(err, contents);
        });
    }

    function listTruncatedObject (fn, host, nextRequest, nextResponse, object, contents, callback) {
        object.MaxKeys = 10000;
        s3[fn](object, function (err, data) {
            if (!err) {
                contents.push.apply(contents, data[host]);
                if (data.IsTruncated) {
                    object[nextRequest] = data[nextResponse];
                    listTruncatedObject(fn, host, nextRequest, nextResponse, object, contents, callback);
                } else {
                    callback(null, contents);
                }
            } else {
                callback(err);
            }
        });
    }

    function listObjectVersions (object, callback) {
        const inCache = cache.key(object.Prefix);
        const cachedContent = inCache.get();
        if (cachedContent) {
            return callback(null, cachedContent);
        }

        listTruncatedObject('listObjectVersions', 'Versions', 'NextVersionIdMarker', 'VersionIdMarker',
            object, [], function (err, contents) {
            if (!err) {
                inCache.store(JSON.stringify(contents));
            }
            callback(err, contents);
        });
    }

    return {
        _cache: cache,
        setCache,
        setS3,
        getObject,
        headObject,
        listObjects,
        listObjectVersions
    };
}
