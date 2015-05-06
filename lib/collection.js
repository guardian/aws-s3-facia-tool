function Collection (id, config) {
    this.id = id;
    this._Key = null;
    this.config = ((config || {}).collections || {})[id];
    this.raw = null;
    this.meta = null;
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

module.exports = Collection;
