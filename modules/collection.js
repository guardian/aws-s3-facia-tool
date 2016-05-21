import {collectionKey} from '../lib/aws-keys';
import Collection from '../lib/collection';
import promise from '../lib/as-promise';

export default function (tool, aws) {
    function create (id, key, config, content) {
        const collection = new Collection(id, config.json);
        collection.setKey(key);
        collection.setContent(content);
        return collection;
    }

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
        }).then(data => create(id, key, config, data));
    }

    return {fetch, fetchAt, create};
}
