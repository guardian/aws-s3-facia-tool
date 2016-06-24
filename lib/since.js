import { min, max, isSameOrBefore, add, subtract } from 'compare-dates';

export function formatDate (date) {
    return [
        date.getFullYear(),
        ('0' + (date.getMonth() + 1)).slice(-2),
        ('0' + date.getDate()).slice(-2)
    ].join('/');
}

export function needed (since, limit) {
    if (since) {
        return getDates(since, limit ? subtract(new Date(), limit, 'days') : new Date());
    } else {
        return [formatDate(new Date())];
    }
}

export function datesBetween (since, to, limit) {
    if (!to) {
        return needed(since, limit);
    } else if (!since) {
        return getDatesBetween(subtract(to, limit, 'days'), to);
    } else {
        return getDatesBetween(since, to);
    }
}

function getDates (date, limit) {
    return getDatesBetween(max(date, limit), new Date());
}

function getDatesBetween (from, to) {
    const needed = [];
    let running = min(from, to);
    const upTo = max(from, to);

    for (let i = 0; isSameOrBefore(running, upTo, 'day'); i += 1) {
        needed.push(formatDate(running));
        running = add(running, 1, 'day');
    }
    return needed;
}
