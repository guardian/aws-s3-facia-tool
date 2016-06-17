import {getPressKey} from '../lib/aws-keys';
import {toListOfVersions} from '../lib/aws-transforms';

export default function (tool, aws) {
    function getLastModified (front, location) {
        const options = tool.options;

        return new Promise(function (resolve, reject) {
            aws.headObject({
                Bucket: options.bucket,
                Key: getPressKey(front, location, options)
            }, function (err, object) {
                if (!err) {
                    resolve(object.LastModified);
                } else if (err && err.statusCode === 404) {
                    resolve(null);
                } else {
                    reject(err);
                }
            });
        });
    }

    function listVersions (front, location) {
        const options = tool.options;

        return new Promise(function (resolve, reject) {
            aws.listObjectVersions({
                Bucket: options.bucket,
                Prefix: getPressKey(front, location, options)
            }, function (err, object) {
                if (err) {
                    reject(err);
                } else {
                    resolve(toListOfVersions(object));
                }
            });
        });
    }

    return {getLastModified, listVersions};
}
