import {getPressKey} from '../lib/aws-keys';
import {toListOfVersions} from '../lib/aws-transforms';

export default function (client) {
    function getLastModified (front, location) {
        const options = client.options;

        return new Promise(function (resolve, reject) {
            client.AWS.headObject({
                Bucket: options.bucket,
                Key: getPressKey(front, location, options)
            }, function (err, object) {
                if (!err) {
                    resolve(new Date(object.LastModified));
                } else if (err && err.statusCode === 404) {
                    resolve(null);
                } else {
                    reject(err);
                }
            });
        });
    }

    function listVersions (front, location) {
        const options = client.options;

        return new Promise(function (resolve, reject) {
            client.AWS.listObjectVersions({
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
