import {expect} from 'chai';
import History from '../modules/history';
import Collection from '../lib/collection';
import Config from '../lib/config';

describe('history at', function () {
	const options = Object.freeze({
		bucket: 'test',
		env: 'TEST',
		configKey: 'config',
        configHistoryPrefix: 'history-prefix',
		collectionHistoryPrefix: 'history-collection-prefix'
	});

    describe('config', function () {
        it('fails if missing time', function () {
            const history = History({options}, {});
            return expect(history.configAt())
            .to.eventually.be.rejectedWith(/missing parameter/i);
        });

        it('returns the config at that given time', function () {
            const history = History({
                options,
                config: {
                    fetchAt: (key) => {
                        expect(key).to.equal('key-1');
                    }
                }
            }, {
                listObjects: (obj, cb) => {
                    cb(null, [{
                        Key: 'key-1',
                        LastModified: new Date(2016, 4, 10, 8, 0)
                    }]);
                }
            });
            const date = new Date(2016, 4, 10, 9, 30);
            return expect(history.configAt(date)).to.eventually.be.fulfilled;
        });
    });

    describe('collection', function () {
        it('fails if missing collection id', function () {
            const history = History({options}, {});
            return expect(history.collectionAt())
            .to.eventually.be.rejectedWith(/missing parameter/i);
        });

        it('fails if missing time', function () {
            const history = History({options}, {});
            return expect(history.collectionAt('something'))
            .to.eventually.be.rejectedWith(/missing parameter/i);
        });

        it('returns the collection at that given time', function () {
            const history = History({
                options,
                collection: {
                    fetchAt: (id, key) => {
                        expect(id).to.equal('something');
                        expect(key).to.equal('key-1');
                    }
                }
            }, {
                listObjects: (obj, cb) => {
                    cb(null, [{
                        Key: 'key-1',
                        LastModified: new Date(2016, 4, 10, 8, 0)
                    }]);
                }
            });
            const date = new Date(2016, 4, 10, 9, 30);
            return expect(history.collectionAt('something', date))
            .to.eventually.be.fulfilled;
        });
    });

    describe('front', function () {
        it('fails if missing front id', function () {
            const history = History({options}, {});
            return expect(history.frontAt())
            .to.eventually.be.rejectedWith(/missing parameter/i);
        });

        it('fails if missing time', function () {
            const history = History({options}, {});
            return expect(history.frontAt('something'))
            .to.eventually.be.rejectedWith(/missing parameter/i);
        });

        it('fails if front doesn\'t exist', function () {
            const configJson = {
                fronts: {
                    some: { collections: ['one', 'two'] }
                },
                collections: { one: { something: true }, two: {} }
            };
            const history = History({
                options,
                history: {
                    configAt: () => {
                        return Promise.resolve(new Config(configJson));
                    }
                }
            });
            const date = new Date(2016, 4, 10, 9, 30);
            return expect(history.frontAt('non-existing', date))
            .to.eventually.be.rejectedWith(/did not exist/i);
        });

        it('fails if collectionAt fails', function () {
            const configJson = {
                fronts: {
                    some: { collections: ['one', 'two'] }
                },
                collections: { one: { something: true }, two: {} }
            };
            const history = History({
                options,
                history: {
                    configAt: () => {
                        return Promise.resolve(new Config(configJson));
                    },
                    collectionAt: () => {
                        return Promise.reject(new Error('invalid collection'));
                    }
                }
            });
            const date = new Date(2016, 4, 10, 9, 30);
            return expect(history.frontAt('some', date))
            .to.eventually.be.rejectedWith(/invalid collection/i);
        });

        it('calls collection callback on fail', function () {
            const configJson = {
                fronts: {
                    some: { collections: ['one', 'two'] }
                },
                collections: { one: { something: true }, two: {} }
            };
            const history = History({
                options,
                history: {
                    configAt: () => {
                        return Promise.resolve(new Config(configJson));
                    },
                    collectionAt: id => {
						if (id === 'one') {
							const collection = new Collection(id, configJson);
							return Promise.resolve(collection);
						} else {
							return Promise.reject(new Error('invalid collection'));
						}
                    }
                }
            });
            const date = new Date(2016, 4, 10, 9, 30);
            return expect(history.frontAt('some', date, (id, ex, cb) => {
				expect(id).to.equal('two');
				cb(null);
			}))
            .to.eventually.be.fulfilled;
        });

        it('returns the front at that given time', function () {
            const configJson = {
                fronts: {
                    some: { collections: ['one', 'two'] }
                },
                collections: { one: { something: true }, two: {} }
            };
            const history = History({
                options,
                history: {
                    configAt: () => {
                        return Promise.resolve(new Config(configJson));
                    },
                    collectionAt: (id, key) => {
                        const collection = new Collection(id, configJson);
                        collection.setKey(key);
                        if (id === 'one') {
                            collection.setContent({
                                live: [{ id: 'fist-story' }]
                            });
                        } else if (id === 'two') {
                            collection.setContent({
                                live: [{ id: 'second-story' }, { id: 'third-story' }]
                            });
                        }
                        return Promise.resolve(collection);
                    }
                }
            });
            const date = new Date(2016, 4, 10, 9, 30);
            return expect(history.frontAt('some', date))
            .to.eventually.be.fulfilled
            .and.then(front => {
                expect(front.toJSON()).to.deep.equal({
                    _id: 'some',
                    config: {
                        collections: ['one', 'two']
                    },
                    collections: [{
                        _id: 'one',
                        something: true
                    }, {
                        _id: 'two'
                    }],
                    collectionsFull: {
                        one: {
                            _id: 'one',
                            config: {
                                _id: 'one',
                                something: true
                            },
                            collection: {
                                live: [{ id: 'fist-story' }]
                            }
                        },
                        two: {
                            _id: 'two',
                            config: {
                                _id: 'two'
                            },
                            collection: {
                                live: [{ id: 'second-story' }, { id: 'third-story' }]
                            }
                        }
                    }
                });
            });
        });
    });
});
