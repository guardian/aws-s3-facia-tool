import Front from './front';
import moment from 'moment';
import visibleStories from './visible-stories';

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

Collection.prototype.trailIds = function (stage) {
    return (this.raw[stage] || []).map(trail => trail.id);
};

Collection.prototype.lastUpdated = function () {
    return this.raw && this.raw.lastUpdated ? moment(this.raw.lastUpdated) : null;
};

Collection.prototype.isBackfilled = function () {
    return this.config && !!this.config.apiQuery;
};

Collection.prototype.hasMetadata = function (type) {
    type = type.toLowerCase();
    var metadata = (this.config || {}).metadata || [];
    for (var i = 0, len = metadata.length; i < len; i += 1) {
        var tag = metadata[i];
        if (tag.type.toLowerCase() === type) {
            return true;
        }
    }
    return false;
};

Collection.prototype.layout = function () {
    return this.config ? this.config.type : null;
};

Collection.prototype.visibleStories = function (scope = 'live') {
    const type = this.layout();
    const list = this.raw && this.raw[scope];
    return visibleStories(type, list);
};

export default Collection;
