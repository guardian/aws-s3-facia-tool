import {expect} from 'chai';
import {History} from '../tmp/bundle.test.js';

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
			const history = History({options});
			return expect(history.configAt())
			.to.eventually.be.rejectedWith(/missing parameter/i);
		});

		it('fails if the config at a given time cannot be fetched', function () {
			const history = History({
				options,
				AWS: {
					getObject (ojb, cb) {
						expect(ojb.Key).to.equal('key-1');
						cb(new Error('invalid config'));
					},
					listObjects (obj, cb) {
						cb(null, [{
							Key: 'key-1',
							LastModified: new Date(2016, 4, 10, 8, 0)
						}]);
					}
				}
			});
			const date = new Date(2016, 4, 10, 9, 30);
			return expect(history.configAt(date))
			.to.eventually.be.rejectedWith(/invalid config while fetching/i);
		});

		it('returns the config at that given time', function () {
			const history = History({
				options,
				AWS: {
					getObject (ojb, cb) {
						expect(ojb.Key).to.equal('key-1');
						cb();
					},
					listObjects (obj, cb) {
						cb(null, [{
							Key: 'key-1',
							LastModified: new Date(2016, 4, 10, 8, 0)
						}]);
					}
				}
			});
			const date = new Date(2016, 4, 10, 9, 30);
			return expect(history.configAt(date)).to.eventually.be.fulfilled;
		});
	});

	describe('collection', function () {
		it('fails if missing collection id', function () {
			const history = History({options});
			return expect(history.collectionAt())
			.to.eventually.be.rejectedWith(/missing parameter/i);
		});

		it('fails if missing time', function () {
			const history = History({options});
			return expect(history.collectionAt('something'))
			.to.eventually.be.rejectedWith(/missing parameter/i);
		});

		it('returns the collection at that given time', function () {
			const history = History({
				options,
				AWS: {
					getObject (obj, cb) {
						expect(obj.Key).to.equal('key-1');
						cb();
					},
					listObjects (obj, cb) {
						cb(null, [{
							Key: 'key-1',
							LastModified: new Date(2016, 4, 10, 8, 0)
						}]);
					}
				}
			});
			const date = new Date(2016, 4, 10, 9, 30);
			return expect(history.collectionAt('something', date))
			.to.eventually.be.fulfilled;
		});
	});

	describe('front', function () {
		it('fails if missing front id', function () {
			const history = History({options});
			return expect(history.frontAt())
			.to.eventually.be.rejectedWith(/missing parameter/i);
		});

		it('fails if missing time', function () {
			const history = History({options});
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
				AWS: {
					listObjects (obj, cb) {
						cb(null, [{ Key: 'one', LastModified: new Date(2016, 4, 10, 8, 0) }]);
					},
					getObject (obj, cb) {
						cb(null, configJson);
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
				AWS: {
					listObjects (obj, cb) {
						if (obj.Prefix.indexOf('/history-prefix/') !== -1) {
							cb(null, [{ Key: 'config', LastModified: new Date(2016, 4, 10, 8, 0) }]);
						} else if (obj.Prefix.indexOf('/history-collection-prefix/') !== -1) {
							cb(null, [{ Key: 'collection-' + obj.Prefix.slice(0, -1).split('/').pop(), LastModified: new Date(2016, 4, 10, 8, 30) }]);
						} else {
							cb(new Error('Invalid listObjects call'));
						}
					},
					getObject (obj, cb) {
						if (obj.Key === 'config') {
							cb(null, configJson);
						} else {
							cb(new Error('Invalid collection'));
						}
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
				AWS: {
					listObjects (obj, cb) {
						if (obj.Prefix.indexOf('/history-prefix/') !== -1) {
							cb(null, [{ Key: 'config', LastModified: new Date(2016, 4, 10, 8, 0) }]);
						} else if (obj.Prefix.indexOf('/history-collection-prefix/') !== -1) {
							cb(null, [{ Key: 'collection-' + obj.Prefix.slice(0, -1).split('/').pop(), LastModified: new Date(2016, 4, 10, 8, 30) }]);
						} else {
							cb(new Error('Invalid listObjects call'));
						}
					},
					getObject (obj, cb) {
						if (obj.Key === 'config') {
							cb(null, configJson);
						} else if (obj.Key === 'collection-one') {
							cb(null, {});
						} else {
							cb(new Error('Invalid collection'));
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
				AWS: {
					listObjects (obj, cb) {
						if (obj.Prefix.indexOf('/history-prefix/') !== -1) {
							cb(null, [{ Key: 'config', LastModified: new Date(2016, 4, 10, 8, 0) }]);
						} else if (obj.Prefix.indexOf('/history-collection-prefix/') !== -1) {
							cb(null, [{ Key: 'collection-' + obj.Prefix.slice(0, -1).split('/').pop(), LastModified: new Date(2016, 4, 10, 8, 30) }]);
						} else {
							cb(new Error('Invalid listObjects call'));
						}
					},
					getObject (obj, cb) {
						if (obj.Key === 'config') {
							cb(null, configJson);
						} else if (obj.Key === 'collection-one') {
							cb(null, {
								live: [{ id: 'fist-story' }]
							});
						} else if (obj.Key === 'collection-two') {
							cb(null, {
								live: [{ id: 'second-story' }, { id: 'third-story' }]
							});
						} else {
							cb(new Error('Invalid collection'));
						}
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
