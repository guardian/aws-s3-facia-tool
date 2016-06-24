import Config from '../lib/config';
import {parallel} from '../lib/series';
import {default as ToolConfig} from './config';
import {default as ToolCollection} from './collection';

export default function (client) {
    function fetch (id, providedConfig) {
        return fetchConfig(providedConfig, client).then(config => {
            if (config.hasFront(id)) {
                return fetchSingleFront(config, config.front(id), client);
            } else {
                return Promise.reject(new Error('Unable to find a front with ID \'' + id + '\''));
            }
        });
    }

    return {fetch};
}

function fetchConfig (providedConfig, client) {
    if (providedConfig) {
        if (providedConfig instanceof Config) {
            return Promise.resolve(providedConfig);
        } else {
            return Promise.reject(new Error('Invalid configuration object in front fetch'));
        }
    } else {
        return ToolConfig(client).fetch();
    }
}

function fetchSingleFront (config, front, client) {
    const options = client.options;
    return parallel(front.listCollectionsIds(), function (collectionId, callback) {
        var collection = config.collection(collectionId);
        front.setCollection(collectionId, collection);

        if (collection.config.uneditable) {
            // This collection cannot be pressed
            collection.setContent(null);
            callback();
        } else {
            ToolCollection(client).fetch(collectionId, config)
            .then(collection => {
                front.setCollection(collectionId, collection);
                callback();
            })
            .catch(() => {
                // Ignore errors, maybe the collection was never pressed?
                collection.setContent(null);
                callback();
            });
        }
    }, options.maxParallelRequests || 4)
    .then(() => front);
}
