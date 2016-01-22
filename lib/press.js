var _ = require('underscore');
var aws = require('./aws');

function Press (tool) {
    this.options = tool.options;
    this.fetchConfig = tool.fetchConfig;
}

Press.prototype.getFrontsWithPressedDates = function () {
    var options = this.options;

    return this.fetchConfig()
    .then(function (res) {
        var returnedFronts = res.json.fronts;
        var fronts = _.map(Object.keys(returnedFronts), function(frontId) {
            var front = returnedFronts[frontId];
            return {
                id: frontId,
                priority: front.priority
            };
        });

        var frontsWithDatesPromises = _.map(fronts, function (front) {
            return new Promise(function (resolve, reject) {
                aws.getLastModified({
                    Bucket: options.bucket,
                    Key: getPressConfigPrefix(front.id, options)
                }, function (err, lastModified) {
                    if (err) {
                        reject(err);
                    } else {
                      resolve({
                          id: front.id,
                          priority: front.priority,
                          lastModified: lastModified
                      });
                    }
                });
            });
        });
        return Promise.all(frontsWithDatesPromises);
    });
};

function getPressConfigPrefix (key, options) {
    return [
        getPressPrefix(options),
        key,
        'fapi/pressed.json'
    ].join('/');
}

function getPressPrefix (options) {
    return [
        options.env,
        options.pressedPrefix
    ].join('/');
}

module.exports = Press;
