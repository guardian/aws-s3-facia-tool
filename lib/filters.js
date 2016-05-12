import moment from 'moment';

export function strictlyWithin (since, to) {
    return function (list) {
        list[0].json = list[0].json.filter(object => {
            return moment(object.lastModified).isBetween(since, to, null, '[]');
        });
        return trimEnd(list, to);
    };
}

export function withinLeading (since, to) {
    return function (list) {
        list[0].json = list[0].json.filter((object, index, array) => {
            if (moment(object.lastModified).isBefore(since)) {
                return array[index + 1] && moment(array[index + 1].lastModified).isSameOrAfter(since);
            } else {
                return moment(object.lastModified).isBefore(to);
            }
        });
        return trimEnd(list, to);
    };
}

function trimEnd (list, to) {
    if (list.length > 1) {
        list[list.length - 1].json = list[list.length - 1].json.filter(
            object => moment(object.lastModified).isSameOrBefore(to)
        );
    }
    return list;
}
