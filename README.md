# aws-s3-facia-tool

Iterate on S3 bockets in facia tool

## Dependencies

This package has a peer dependency on `aws-sdk` version `2.2x`.

## Installation

```
npm install aws-s3-facia-tool --save
```

## Example

Check index.js for an example use. It find unused collections an articles with HTML in the metadata.


## Usage

```
var FaciaTool = require('aws-s3-facia-tool');
tool = new FaciaTool(options);
```

### options

Check config.json

### API

* __fetchConfig__ Fetch the current configuration.

* __listCollections__ Fetch the whole list of collections

* __fetchCollections__ Fetch the collections' configuration. Optional filter
