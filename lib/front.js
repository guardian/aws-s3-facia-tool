var _ = require('lodash');

function Front (name, config, history) {
    this.front = name;
    this.json = config.front(name);

    var collections = this.collections = {};
    this.json.collections.forEach(function (id) {
        if (!collections[id]) {
            // TODO new collection class?
            collections[id] = config.collection(id);
        }
    });

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

Front.prototype.allCollectionsEver = function() {
    return Object.keys(this.collections);
};

module.exports = Front;
