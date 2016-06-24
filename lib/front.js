export default class Front {
    constructor (name, config) {
        this.id = name;
        this.config = config.fronts[name];
        this.collectionsConfiguration = {};

        if (this.config && this.config.collections) {
            this.collections = this.config.collections.map(function (collectionId) {
                var collectionConfig = config.collections[collectionId] || {};
                collectionConfig._id = collectionId;
                return collectionConfig;
            });
        }
    }

    toJSON () {
        return {
            _id: this.id,
            config: this.config,
            collections: this.collections,
            collectionsFull: iterateToJSON(this.collectionsConfiguration)
        };
    }

    setCollection (id, collection) {
        this.collectionsConfiguration[id] = collection;
    }

    collection (id) {
        return this.collectionsConfiguration[id];
    }

    lastUpdated () {
        let last = null;
        for (var key in this.collectionsConfiguration) {
            var collection = this.collectionsConfiguration[key];
            var current = collection.lastUpdated();
            if (!last && current) {
                last = current;
            } else if (last && current && last < current) {
                last = current;
            }
        }
        return last;
    }

    priority () {
        return this.config.priority || 'editorial';
    }

    listCollectionsIds () {
        return this.collections.map(function (collection) {
            return collection._id;
        });
    }
}

function iterateToJSON (object) {
    var clone = {};
    for (var key in object) {
        clone[key] = object[key].toJSON();
    }
    return clone;
}
