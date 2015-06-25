var Promise = require('es6-promise').Promise;
var async = require('async');

exports.parallel = function (list, fn, limit) {
    return new Promise(function (resolve, reject) {
        async.parallelLimit(list.map(function (object) {
            return function (callback) {
                var handler = function (err, data) {
                    if (!err) {
                        data = {
                            object: object,
                            json: data
                        };
                    }
                    callback(err, data);
                };

                fn(object, handler);
            };
        }), limit, function (err, results) {
            if (err) {
                reject(err);
            } else {
                resolve(results);
            }
        });
    });
};
