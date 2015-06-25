var path = require('path');
var fs = require('fs');
var mkdirp = require('mkdirp');

exports.cacheEnabled = false;
exports.basePath = path.join(__dirname, '/../tmp/');

exports.key = function (key) {
    var filename = path.join(exports.basePath, key.replace(/[\/:@]/g, '_'));

    return {
        get: function () {
            if (exports.cacheEnabled) {
                if (fs.existsSync(filename)) {
                    var content = fs.readFileSync(filename);

                    return JSON.parse(content.toString());
                }
            }
        },
        store: function (text) {
            if (exports.cacheEnabled) {
                mkdirp.sync(path.dirname(filename));
                fs.writeFileSync(filename, text);
            }
        }
    };
};
