import {collectionKey, collectionsPrefix} from '../lib/aws-keys';
import {toListOfCollectionsKeys} from '../lib/aws-transforms';
import Collection from '../lib/collection';
import promise from '../lib/as-promise';

export default function (client) {
    function create (id, key, config, content) {
        const collection = new Collection(id, config.json);
        collection.setKey(key);
        collection.setContent(content);
        return collection;
    }

    function fetch (id, config = {}) {
        return fetchAt(id, collectionKey(id, client.options), config);
    }

    function fetchAt (id, key, config = {}) {
        const options = client.options;
        return promise(cb => {
            client.AWS.getObject({
                Bucket: options.bucket,
                Key: key
            }, cb);
        }).then(data => create(id, key, config, data));
    }

    function list () {
        const options = client.options;
        const prefix = collectionsPrefix(options);

        return promise(cb => {
            client.AWS.listObjects({
                Bucket: options.bucket,
                Prefix: prefix
            }, cb);
        })
        .then(data => toListOfCollectionsKeys(prefix, data));
    }

    return {fetch, fetchAt, create, list};
}
