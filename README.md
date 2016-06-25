# aws-s3-facia-tool

API on top of facia tool storage

## Dependencies

This package has a peer dependency on `aws-sdk` version `2.x`.

## Installation

```
npm install aws-s3-facia-tool --save
```

## Usage

```js
const facia = require('aws-s3-facia-tool');
const client = new facia.Client({
    'bucket': 'bucket-used-by-fronts-tool',
    'env': 'CODE',
    'configKey': 'where/config.json/lives',
    'configHistoryPrefix': 'path/containing/config/history',
    'collectionHistoryPrefix': 'path/containing/collections/history',
    'collectionsPrefix': 'path/containing/collection.json',
    'pressedPrefix': 'path/containing/pressed.json',
    'maxParallelRequests': 6,
    'maxDaysHistory': 7
});
```

### Config

```js
const facia = require('aws-s3-facia-tool');
const client = new facia.Client({});
facia.Config(client).fetch()
.then(config => {
    // use the config here
})
```

 * `Config.fetch()` - Fetch the config JSON from the bucket, returns a `Config` class
 * `Config.head()` - Performs a `head` action, the resulting promise is resolved with the config metadata (e.g. `ETag`, `LastModified`)
 * `Config.get()` - Returns the `Config` class using in memory cache, it reads from the bucket only when the cache is empty.
 * `Config.json()` - Returns the config JSON instead of the utility class. It uses the cache
 * `Config.fetchAt(key)` - Returns a `Config` class reading from `key` instead of the internal configuration

#### Config class

Instances of `Config` class have the following methods

 * `hasFront(front)` - Boolean, whether a `front` exists
 * `hasCollection(id)` - Boolean, whether a collection with `id` exists
 * `listFrontsIds(priority)` - List of all front id. Optionally filter by priority
 * `listCollectionsIds()` - List of all collection id
 * `front(path)` - Return a `Front` class for the given path
 * `collection` - Return a `Collection` class for the given id
 * `fronts.find(query)` - Return a list of `Front` classes for all paths that match the `query`
 * `collections.find(query)` - Return a list of `Collection` classes for all paths that match the `query`


### Collection

```js
const facia = require('aws-s3-facia-tool');
const client = new facia.Client({});
facia.Collection(client).fetch()
.then(collection => {
    // use the collection here
})
```

 * `fetch (id, config)` - Fetch a collection `id`. `config` is optional if you're just interested in the collection content, otherwise pass a `config` object
 * `fetchAt (id, key, config)` - Fetch a collection with `id` at a specified `key`
 * `list()` - List all collections in the bucket (including the ones that have been removed from fronts)

#### Collection class

Instances of `Front` class have the following methods

  * `forEachArticle(action)` - Perform an `action` for each item in the collection. `action` receives `(stage, article)` where `stage` is `live` / `draft` / `treats`
  * `setContent(json)` - Set the content of the collection
  * `setKey(key)` - Set the key storing the collection content
  * `toJSON()` - Return the collection as JSON. The result object contains
     * `config`: the collection config
     * `collection`: the collection content
  * `trails(stage)` - Return the list of trail in `stage` (`live` / `draft` / `treats`)
  * `lastUpdated()` - Return the last updated date
  * `isBackfilled()` - Whether the collection has a backfill
  * `hasMetadata(type)` - Whether the collection has metadata of `type` (e.g. collection tags)
  * `layout()` - Return the collection layout
  * `visibleStories(scope)` - Number of visible stories (above show more) on desktop and mobile


### Front

```js
const facia = require('aws-s3-facia-tool');
const client = new facia.Client({});
facia.Front(client).fetch()
.then(front => {
    // use the front here
})
```

 * `fetch (path, config)` - Fetch a front with `path`. `config` is optional, the tool will get it from S3 if not specified

#### Front class

Instances of `Front` class have the following methods

 * `toJSON()` - Return the front a JSON. The result object contains
    * `config`: the front configuration
    * `collections`: the collections configuration
    * `collectionsFull`: the collections content
 * `setCollection(id, collection)` - Set the content a collection
 * `collection(id)` - Return a `Collection` class for the collection with `id`
 * `lastUpdated()` - Return the last updated date
 * `priority()` - Return the explicit priority
 * `listCollectionsIds()` - List all collection id


### Press

```js
const facia = require('aws-s3-facia-tool');
const client = new facia.Client({});
facia.Press(client).getLastModified('front-path', 'live')
.then(lastModified => {
    // date
})
```

 * `getLastModified(path, location)` - Get the last modified date of a front in either `live` or `draft`
