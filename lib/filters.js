import {isBetween, isBefore, isSameOrAfter, isSameOrBefore} from 'compare-dates';

/**
 * Return all values strictly within since and to (included)
 */
export function strictlyWithin (since, to) {
    return function (list) {
        list[0].json = list[0].json.filter(object => {
            return isBetween(new Date(object.lastModified), since, to, null, '[]');
        });
        return trimEnd(list, to);
    };
}

/**
 * Return all value between since and to (included) and also
 * the last value (leading) before since
 */
export function withinLeading (since, to) {
    return function (list) {
        list[0].json = list[0].json.filter((object, index, array) => {
            if (isBefore(new Date(object.lastModified), since)) {
                return array[index + 1] && isSameOrAfter(new Date(array[index + 1].lastModified), since);
            } else {
                return isBefore(new Date(object.lastModified), to);
            }
        });
        return trimEnd(list, to);
    };
}

function trimEnd (list, to) {
    if (list.length > 1) {
        list[list.length - 1].json = list[list.length - 1].json.filter(
            object => isSameOrBefore(new Date(object.lastModified), to)
        );
    }
    return list;
}
