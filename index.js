/* globals Promise:true */
var Promise = require('es6-promise').Promise;
var FaciaTool = require('./lib/facia-tool');
var config = require('./config');
var aws = require('./lib/aws');
var moment = require('moment');

aws.setCache(true);

var tool = new FaciaTool(config);

Promise.all([
    tool.fetchConfig(),
    tool.listCollections(),
    tool.front('fabio-banana'),
    tool.history.config(moment().subtract(4, 'days')),
    tool.history.collection('uk-alpha/news/regular-stories', moment().subtract(4, 'days')),
    tool.history.collection('e29ca504-c23b-4dca-9f41-5f2885c5e917', moment().subtract(4, 'days')),
    tool.history.front({
        front: 'fabio-banana',
        since: moment().subtract(24, 'hours')
    })
])
.then(function () {
    var notInConfig = tool.list.filter(function (object) {
        return !tool.config.hasCollection(object.id);
    });

    console.log('There are ' + notInConfig.length + ' collections.json object that are not in any front');
    // console.log(notInConfig.toString());

    return tool.fetchCollections(function (object) {
        return tool.config.hasCollection(object.id);
    });
})
.then(function (list) {
    var mataToLookAt = ['customKicker', 'trailText'],
        count = {
            totalArticles: 0,
            totalCollections: 0
        };
    mataToLookAt.forEach(function (meta) {
        count[meta] = {
            withText: 0,
            withHTML: 0
        };
    });

    list.forEach(function (collection) {
        count.totalCollections += 1;

        collection.eachArticle(function (container, article) {
            count.totalArticles += 1;

            mataToLookAt.forEach(function (meta) {
                var value = (article.meta || {})[meta];

                if (value) {
                    count[meta].withText += 1;
                }
                if (containsHTML(value)) {
                    // logHTML(collection, container, article, meta, value);
                    count[meta].withHTML += 1;
                }
            });
        });
    });

    console.log(count);

    var front = tool.lastFront;
    return tool.findCollections(front.allCollectionsEver());
})
.then(function (list) {
    // console.log(list);
    return tool.historyCollection(list[0].id, moment().subtract(24, 'hours'));
})
.then(function (something) {
    console.log(something);
})
.catch(function (err) {
    console.trace(err);
});

// function logHTML (collection, container, article, where, what) {
//     console.log(container + ' article ' + article.id + ' in collection ' + collection.id +
//         ' contains HTML in ' + where + ': ' + what);
// }

// var hasTag = /<[a-z][\s\S]*>/i; // ?
function containsHTML (string) {
    // return hasTag.test(string);
    return string && string.indexOf('<') > -1;
}
