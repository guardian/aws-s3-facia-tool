var moment = require('moment');

var isCollectionJson = /collection.json$/;

function List (prefix, json) {
    this.prefix = prefix;
    this.raw = json;
    this.all = [];

    json.forEach(function (object) {
        if (isCollectionJson.test(object.Key)) {
            this.all.push({
                Key: object.Key,
                LastModified: moment(object.LastModified),
                raw: object,
                id: exctractCollection(prefix, object.Key)
            });
        }
    }, this);

    this.length = this.all.length;
}

List.prototype.filter = function (filter) {
    return new List(this.prefix, this.all.filter(filter));
};

List.prototype.toString = function () {
    return this.all.map(function (object) {
        return object.id;
    }).join(', ');
};

function exctractCollection (prefix, key) {
    return key.substring(prefix.length + 1, key.lastIndexOf('/collection.json'));
}

module.exports = List;
