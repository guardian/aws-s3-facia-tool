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

/*
function doSomethingAboutHistory ()  {
    var historicalCollections = this.historicalCollections = [];
    var previousKnowCollections = this.json, previousKnowConfig = config;
    history.all.forEach(function (pastConfig) {
        var pastCollections = pastConfig.config.front(name);
        if (
            !_.isEqual(pastCollections, previousKnowCollections) ||
            anyDifferenceInCollectionsConfig(name, pastConfig, previousKnowConfig)
        ) {
            console.log('TODO these are different collections in history');
            previousKnowCollections = pastCollections;
            previousKnowConfig = pastConfig;
            // TODO do something smart here, record when this came and when it went away
            historicalCollections.push({});
        }
    });
}

function anyDifferenceInCollectionsConfig (front, pastConfig, previousKnowConfig) {
    return _.find(pastConfig.config.front(front).collections, function (collection) {
        return !_.isEqual(pastConfig.config.collection(collection), previousKnowConfig.collection(collection));
    });
}
*/

Front.prototype.allCollections = function() {
    return this.collections.map(function (collection) {
        return collection._id;
    });
};

function iterateToJSON(object) {
    var clone = {};
    for (var key in object) {
        clone[key] = object[key].toJSON();
    }
    return clone;
}

module.exports = Front;
