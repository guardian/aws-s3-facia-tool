// TODO I'd love to use this import but it breaks tests
// import parallelLimit from 'async-es/parallelLimit';
import async from 'async';
const parallelLimit = async.parallelLimit;

export function parallel (list, fn, limit) {
    return new Promise((resolve, reject) => {
        parallelLimit(
            list.map(object => createAction(fn, object)),
            limit,
            (err, results) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(results);
                }
            }
        );
    });
}

function createAction (callOnEveryObject, object) {
    return function (callback) {
        const handler = (err, data) => {
            if (!err) {
                data = {
                    object: object,
                    json: data
                };
            }
            process.nextTick(() => callback(err, data));
        };

        callOnEveryObject(object, handler);
    };
}
