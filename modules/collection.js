import {collectionKey} from '../lib/aws-keys';
import Collection from '../lib/collection';
import promise from '../lib/as-promise';

export default function (tool, aws) {
    function fetch (id, config = {}) {
        return fetchAt(id, collectionKey(id, tool.options), config);
    }

    function fetchAt (id, key, config = {}) {
        const options = tool.options;
        return promise((cb) => {
            aws.getObject({
                Bucket: options.bucket,
                Key: key
            }, cb);
        }).then(data => {
            const collection = new Collection(id, config.json);
            collection.setKey(key);
            collection.setContent(data);
            return collection;
        });
    }

    return {fetch, fetchAt};
}
