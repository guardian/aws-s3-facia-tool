function Collection (description) {
    this.id = description.object.id;
    this.raw = description.json;
    this.meta = description.object;
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

module.exports = Collection;
