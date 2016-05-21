function Front (name, config) {
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

Front.prototype.toJSON = function () {
    return {
        _id: this.id,
        config: this.config,
        collections: this.collections,
        collectionsFull: iterateToJSON(this.collectionsConfiguration)
    };
};

Front.prototype.setCollection = function (id, collection) {
    this.collectionsConfiguration[id] = collection;
};

Front.prototype.collection = function (id) {
    return this.collectionsConfiguration[id];
};

Front.prototype.lastUpdated = function () {
    var last = null;
    for (var key in this.collectionsConfiguration) {
        var collection = this.collectionsConfiguration[key];
        var current = collection.lastUpdated();
        if (!last && current) {
            last = current;
        } else if (last && current && current.isAfter(last)) {
            last = current;
        }
    }
    return last;
};

Front.prototype.priority = function () {
    return this.config.priority || 'editorial';
};

Front.prototype.allCollections = function () {
    return this.collections.map(function (collection) {
        return collection._id;
    });
};

function iterateToJSON (object) {
    var clone = {};
    for (var key in object) {
        clone[key] = object[key].toJSON();
    }
    return clone;
}

module.exports = Front;
