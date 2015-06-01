var moment = require('moment');

function List (id, since, json) {
    this.id = id;
    this.raw = json;
    this.all = [];
    this.since = since;
    this.length = 0;
}

List.prototype.append = function (json) {
    json.forEach(function (object) {
        var editTime = moment(object.LastModified);
        if (isAfter(this.since, editTime)) {
            this.all.push({
                Key: object.Key,
                date: editTime,
                raw: object,
                id: this.id
            });
        }
    }, this);

    this.all.sort(function (a, b) {
        return a.date.isSame(b.date) ? 0 : a.date.isBefore(b.date) ? 1 : -1;
    });

    this.length = this.all.length;
};

function isAfter (since, date) {
    if (!since) {
        return true;
    } else {
        return moment(date).isAfter(since);
    }
}

module.exports = List;
