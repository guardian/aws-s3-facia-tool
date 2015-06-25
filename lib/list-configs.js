var moment = require('moment');

function List (prefix, since, json) {
    this.prefix = prefix;
    this.raw = json;
    this.all = [];
    this.since = since;
    this.length = 0;

    if (json) {
        this.append(json);
    }
}

List.prototype.append = function (json) {
    json.forEach(function (object) {
        var info = extractInfoFromKey(object.Key);
        if (isAfter(this.since, info.date)) {
            this.all.push({
                Key: object.Key,
                date: moment(info.date),
                raw: object,
                author: info.author
            });
        }
    }, this);
    this.all.sort(function (a, b) {
        return a.date.isSame(b.date) ? 0 : a.date.isBefore(b.date) ? 1 : -1;
    });

    this.length = this.all.length;
};

List.prototype.filter = function (filter) {
    return new List(this.prefix, this.since, this.all.filter(filter));
};

List.prototype.toString = function () {
    return this.all.map(function (object) {
        return object.Key;
    }).join(', ');
};

function extractInfoFromKey (key) {
    var meta = key.split('/').pop().split('.'),
        // Time contains one dot
        date = meta.slice(0, 2).join('.'),
        // Author shouldn't contain .json
        author = meta.slice(2, -1).join('.');

    return {
        date: date,
        author: author
    };
}

function isAfter (since, date) {
    if (!since) {
        return true;
    } else {
        return moment(date).isAfter(since);
    }
}

module.exports = List;
