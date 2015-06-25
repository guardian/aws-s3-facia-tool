var Front = require('./front');
var Collection = require('./collection');
var jsonQuery = require('./query');

function Config (json) {
    this.json = json;

    this.fronts = utility(this, 'fronts', function (key) {
        return this.front(key);
    });
    this.collections = utility(this, 'collections', function (key) {
        return this.collection(key);
    });
}

Config.prototype.hasFront = function (id) {
    return !!this.json.fronts[id];
};

Config.prototype.hasCollection = function (id) {
    return !!this.json.collections[id];
};

Config.prototype.front = function (front) {
    return new Front(front, this.json);
};

Config.prototype.collection = function (id) {
    return new Collection(id, this.json);
};

Config.prototype.listFrontsIds = function () {
    return Object.keys(this.json.fronts || {});
};

Config.prototype.listCollectionsIds = function () {
    return Object.keys(this.json.collections || {});
};

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

module.exports = Config;
