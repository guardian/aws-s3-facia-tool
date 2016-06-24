import Front from './front';
import visibleStories from './visible-stories';

const articleContainers = ['draft', 'live', 'treats'];

export default class Collection {
    constructor (id, config) {
        this.id = id;
        this._Key = null;
        this.config = ((config || {}).collections || {})[id];
        this.raw = null;

        const fronts = (config || {}).fronts || {};
        this.fronts = function () {
            return Object.keys(fronts).filter(function (front) {
                return (fronts[front].collections || []).indexOf(id) !== -1;
            }).map(function (front) {
                return new Front(front, config);
            });
        };
    }

    forEachArticle (action) {
        articleContainers.forEach(function (container) {
            if (this.raw[container]) {
                this.raw[container].forEach(function (article) {
                    action(container, article);
                });
            }
        }, this);
    }

    setContent (json) {
        this.raw = json;
    }

    setKey (key) {
        this._Key = key;
    }

    toJSON () {
        return {
            _id: this.id,
            config: this.config,
            collection: this.raw
        };
    }

    trails (stage) {
        return (this.raw[stage] || []);
    }

    lastUpdated () {
        return this.raw && this.raw.lastUpdated ? new Date(this.raw.lastUpdated) : null;
    }

    isBackfilled () {
        return this.config && !!this.config.backfill;
    }

    hasMetadata (type) {
        type = type.toLowerCase();
        const metadata = (this.config || {}).metadata || [];
        for (let i = 0, len = metadata.length; i < len; i += 1) {
            const tag = metadata[i];
            if (tag.type.toLowerCase() === type) {
                return true;
            }
        }
        return false;
    }

    layout () {
        return this.config ? this.config.type : null;
    }

    visibleStories (scope = 'live') {
        const type = this.layout();
        const list = this.raw && this.raw[scope];
        return visibleStories(type, list);
    }
}
