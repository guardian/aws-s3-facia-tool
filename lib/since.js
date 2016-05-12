import moment from 'moment';

export function needed (since, limit) {
    if (since) {
        return getDates(since, limit ? moment().subtract(limit, 'days') : moment());
    } else {
        return [moment().format('YYYY/MM/DD')];
    }
}

export function datesBetween (since, to, limit) {
    if (!to) {
        return needed(since, limit);
    } else if (!since) {
        return getDatesBetween(moment(to).subtract(limit, 'days'), to);
    } else {
        return getDatesBetween(since, to);
    }
}

function getDates (date, limit) {
    return getDatesBetween(moment(moment.max(date, limit)), moment());
}

function getDatesBetween (from, to) {
    const needed = [];
    const running = moment(moment.min(from, to));
    const upTo = moment(moment.max(from, to));

    for (let i = 0; running.isSameOrBefore(upTo, 'day'); i += 1) {
        needed.push(running.format('YYYY/MM/DD'));
        running.add(1, 'day');
    }
    return needed;
}
