var Promise = require('es6-promise').Promise;
var aws = require('./aws');

function Press (tool) {
    this.options = tool.options;
}

Press.prototype.getLastModified = function (front, location) {
    var options = this.options;

    return new Promise(function (resolve, reject) {
        aws.headObject({
            Bucket: options.bucket,
            Key: getPressConfigKey(front, location, options)
        }, function (err, object) {
            if (!err) {
                resolve(object.LastModified);
            } else if (err && err.statusCode === 404) {
                resolve(null);
            } else {
                reject(err);
            }
        });
    });
};

function getPressConfigKey (front, location, options) {
    return [
        options.env,
        options.pressedPrefix,
        location === 'draft' ? 'draft' : 'live',
        front,
        'fapi/pressed.json'
    ].join('/');
}

module.exports = Press;
