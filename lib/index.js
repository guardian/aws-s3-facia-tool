import defaultAws from './aws';
import * as FILTERS from './filters';

export class Client {
    constructor (options, overrideAWS) {
        this.options = options;
        this.AWS = overrideAWS || defaultAws(options.credentialsProvider);
    }
}

export {FILTERS};

export { default as Collection } from '../modules/collection';
export { default as Config } from '../modules/config';
export { default as Front } from '../modules/front';
export { default as History } from '../modules/history';
export { default as List } from '../modules/list';
export { default as Press } from '../modules/press';
export { default as CollectionClass } from './collection';
export { default as ConfigClass } from './config';
export { default as FrontClass } from './front';

export {
    setBasePath as setCacheBasePath,
    setEnabled as setCacheEnabled
} from './cache';

// FIXME these are exported for testing purposes, find a better way
// although it's not a big deal with tree shaking
export { defaultAws as s3 };
export { default as _findInHistory } from './find-history';
export { default as _ListConfigs } from './list-configs';
export {
    needed as _needed,
    datesBetween as _datesBetween
} from './since';
export { default as _promise } from './as-promise';
export { key as _cacheKey } from './cache';
