var moment = require('moment');

exports.needed = function (since, limit) {
    if (since) {
        return getDates(since, limit ? moment().subtract(limit, 'days') : moment());
    } else {
        return [moment().format('YYYY/MM/DD')];
    }
};

function getDates (date, limit) {
    var needed = [],
        running = moment(moment.max(date, limit)),
        now = moment();

    for (var i = 0; !running.isAfter(now, 'day'); i += 1) {
        needed.push(running.format('YYYY/MM/DD'));
        running.add(1, 'day');
    }
    return needed;
}
