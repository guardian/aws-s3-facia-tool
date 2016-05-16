import moment from 'moment';
import promise from './as-promise';
import {formatDate} from './since';

export default function (date, prefixGenerator, options, aws) {
    return recurse(moment(date), moment(date), prefixGenerator, options, aws);
}

function recurse (targetDate, runningDate, prefixGenerator, options, aws) {
    const prefix = prefixGenerator(formatDate(runningDate), options);
    if (targetDate.diff(runningDate, 'days') > options.maxDaysHistory) {
        return Promise.reject(new Error('maxDaysHistory reached'));
    }

    return promise(cb => {
        aws.listObjects({
            Bucket: options.bucket,
            Prefix: prefix
        }, cb);
    })
    .then(data => {
        if (data.length) {
            if (targetDate.isSame(runningDate, 'day')) {
                const index = data.findIndex(point => targetDate.isBefore(point.LastModified));
                if (index === -1) {
                    // all data points are before what I'm looking for, take the last
                    return data[data.length - 1];
                } else if (index === 0){
                    // all data points are after what I'm looking for, try the day before
                    return recurse(targetDate, runningDate.subtract(1, 'day'), prefixGenerator, options, aws);
                } else {
                    // index is the first point after what I'm looking for, I need the one before
                    return data[index - 1];
                }
            } else {
                // avoid doing a findIndex, what I'm looking for is the last event
                return data[data.length - 1];
            }
        } else {
            // couldn't find anything, go back in time
            return recurse(targetDate, runningDate.subtract(1, 'day'), prefixGenerator, options, aws);
        }
    });
}
