/* globals Promise:true */
var Promise = require('es6-promise').Promise;
var FaciaTool = require('./lib/facia-tool');
var config = require('./config');
var aws = require('./lib/aws');

aws.setCache(true);

var tool = new FaciaTool(config);

Promise.all([
    tool.fetchConfig(),
    tool.listCollections()
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
