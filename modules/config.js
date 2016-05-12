import {configKey} from '../lib/aws-keys';
import Config from '../lib/config';
import promise from '../lib/as-promise';

export default function (tool, aws) {
    let cachedConfig;

    function fetch () {
        const options = tool.options;
        return promise((cb) => {
            aws.getObject({
                Bucket: options.bucket,
                Key: configKey(options)
            }, cb);
        }).then(data => {
            cachedConfig = new Config(data);
            return cachedConfig;
        });
    }

    function head () {
        const options = tool.options;
        return promise((cb) => {
            aws.headObject({
                Bucket: options.bucket,
                Key: configKey(options)
            }, cb);
        });
    }

    function get () {
        if (cachedConfig) {
            return Promise.resolve(cachedConfig);
        } else {
            return fetch();
        }
    }

    function json () {
        return get().then(config => config.json);
    }

    function fetchAt (key) {
        const options = tool.options;
        return promise((cb) => {
            aws.getObject({
                Bucket: options.bucket,
                Key: key
            }, cb);
        }).then(data => {
            return new Config(data);
        });
    }

    return {fetch, get, json, head, fetchAt};
}
