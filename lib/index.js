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
export { default as CollectionClass } from '../lib/collection';
export { default as ConfigClass } from '../lib/config';
export { default as FrontClass } from '../lib/front';
