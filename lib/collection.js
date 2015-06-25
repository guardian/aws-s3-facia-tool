var Front = require('./Front');
var moment = require('moment');

function Collection (id, config) {
    this.id = id;
    this._Key = null;
    this.config = ((config || {}).collections || {})[id];
    this.raw = null;

    var fronts = (config || {}).fronts || {};
    this.fronts = function () {
        return Object.keys(fronts).filter(function (front) {
            return (fronts[front].collections || []).indexOf(id) !== -1;
        }).map(function (front) {
            return new Front(front, config);
        });
    };
}

var articleContainers = ['draft', 'live', 'treats'];

Collection.prototype.eachArticle = function (action) {
    articleContainers.forEach(function (container) {
        if (this.raw[container]) {
            this.raw[container].forEach(function (article) {
                action(container, article);
            });
        }
    }, this);
};

Collection.prototype.setContent = function (json) {
    this.raw = json;
};

Collection.prototype.setKey = function (key) {
    this._Key = key;
};

Collection.prototype.toJSON = function () {
    return {
        _id: this.id,
        config: this.config,
        collection: this.raw
    };
};

Collection.prototype.lastUpdated = function () {
    return this.raw && this.raw.lastUpdated ? moment(new Date(this.raw.lastUpdated)) : null;
};

module.exports = Collection;
