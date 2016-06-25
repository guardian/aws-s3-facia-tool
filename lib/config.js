import Front from './front';
import Collection from './collection';
import jsonQuery from './query';

export default class Config {
    constructor (json) {
        this.json = json;

        this.fronts = utility(this, 'fronts', function (key) {
            return this.front(key);
        });
        this.collections = utility(this, 'collections', function (key) {
            return this.collection(key);
        });
    }

    hasFront (id) {
        return !!this.json.fronts[id];
    }

    hasCollection (id) {
        return !!this.json.collections[id];
    }

    front (front) {
        return new Front(front, this.json);
    }

    collection (id) {
        return new Collection(id, this.json);
    }

    listFrontsIds (priority) {
        const all = Object.keys(this.json.fronts || {});
        if (priority) {
            return all.filter(front => {
                return new Front(front, this.json).priority() === priority;
            });
        } else {
            return all;
        }
    }

    listCollectionsIds () {
        return Object.keys(this.json.collections || {});
    }
}

function utility (config, key, getter) {
    var allValues = null;

    function find (query) {
        query = query || {};

        if (!allValues) {
            allValues = Object.keys(config.json[key]).map(getter.bind(config));
        }

        return jsonQuery(query, allValues);
    }

    return {
        find: find
    };
}
