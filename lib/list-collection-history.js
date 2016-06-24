import { isSame, isBefore, isAfter } from 'compare-dates';

function List (id, since, json) {
    this.id = id;
    this.raw = json;
    this.all = [];
    this.since = since;
    this.length = 0;
}

List.prototype.append = function (json) {
    json.forEach(function (object) {
        var editTime = new Date(object.LastModified);
        if (isLocalAfter(this.since, editTime)) {
            this.all.push({
                Key: object.Key,
                date: editTime,
                raw: object,
                id: this.id
            });
        }
    }, this);

    this.all.sort(function (a, b) {
        return isSame(a.date, b.date) ? 0 : isBefore(a.date, b.date) ? 1 : -1;
    });

    this.length = this.all.length;
};

function isLocalAfter (since, date) {
    if (!since) {
        return true;
    } else {
        return isAfter(date, since);
    }
}

export default List;
