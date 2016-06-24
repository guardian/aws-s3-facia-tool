import {expect} from 'chai';
import {History, FILTERS} from '../dist/bundle.es6';
const {strictlyWithin, withinLeading} = FILTERS;

describe('history module', function () {
	const tool = {
		options: Object.freeze({
			bucket: 'test',
			env: 'TEST',
			configKey: 'config',
			configHistoryPrefix: 'history-prefix',
			collectionHistoryPrefix: 'history-collection-prefix'
		})
	};

	describe('configList', function () {
		it('fails if since is not specified', function () {
			const history = History(tool);

			return expect(history.configList(null, null))
				.to.eventually.be.rejectedWith(/missing .* parameter/i);
		});

		it('fails if to is not specified', function () {
			const date = new Date(2016, 0, 31);
			const history = History(tool);

			return expect(history.configList(date, null))
				.to.eventually.be.rejectedWith(/missing .* parameter/i);
		});

		it('fails if aws fails', function () {
			tool.AWS = {
				listObjects (obj, cb) {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Prefix: 'TEST/history-prefix/2016/01/31/'
					});
					cb(new Error('invalid aws'));
				}
			};
			const date = new Date(2016, 0, 31);
			const history = History(tool);

			return expect(history.configList(date, date))
				.to.eventually.be.rejectedWith(/invalid aws/i);
		});

		it('resolves with aws list', function () {
			const since = new Date(2016, 0, 31);
			const to = new Date(2016, 1, 1);
			const calls = [];
			tool.AWS = {
				listObjects (obj, cb) {
					calls.push(obj.Prefix);
					cb(null, [{
						Key: 'test-key-' + obj.Prefix.substr(-3, 2),
						LastModified: since.toString(),
						ETag: 'test-tag'
					}]);
				}
			};

			const history = History(tool);
			return expect(history.configList(since, to))
				.to.eventually.deep.equal([{
					json: [{
						key: 'test-key-31',
						lastModified: since,
						etag: 'test-tag'
					}],
					object: '2016/01/31'
				}, {
					json: [{
						key: 'test-key-01',
						lastModified: since,
						etag: 'test-tag'
					}],
					object: '2016/02/01'
				}])
				.then(() => {
					expect(calls).to.deep.equal([
						'TEST/history-prefix/2016/01/31/',
						'TEST/history-prefix/2016/02/01/'
					]);
				});
		});

		it('resolves with aws list filtering results', function () {
			const date = new Date(2016, 0, 31, 11, 0);
			tool.AWS = {
				listObjects (obj, cb) {
					cb(null, [{
						Key: 'test-key-1',
						LastModified: (new Date(2016, 0, 31, 10, 0)).toISOString(),
						ETag: 'test-tag'
					}, {
						Key: 'test-key-2',
						LastModified: (new Date(2016, 0, 31, 12, 0)).toISOString(),
						ETag: 'test-tag'
					}]);
				}
			};

			const history = History(tool);
			return expect(history.configList(date, date, withinLeading(date, date)))
				.to.eventually.deep.equal([{
					json: [{
						key: 'test-key-1',
						lastModified: new Date(2016, 0, 31, 10, 0),
						etag: 'test-tag'
					}],
					object: '2016/01/31'
				}]);
		});
	});

	describe('collectionList', function () {
		it('fails if since is not specified', function () {
			const history = History(tool);

			return expect(history.collectionList(null, null))
				.to.eventually.be.rejectedWith(/missing .* parameter/i);
		});

		it('fails if to is not specified', function () {
			const date = new Date(2016, 0, 31);
			const history = History(tool);

			return expect(history.collectionList(date, null))
				.to.eventually.be.rejectedWith(/missing .* parameter/i);
		});

		it('fails if collection is not specified', function () {
			const date = new Date(2016, 0, 31);
			const history = History(tool);

			return expect(history.collectionList(date, date))
				.to.eventually.be.rejectedWith(/missing collection/i);
		});

		it('fails if aws fails', function () {
			const since = new Date(2016, 0, 31, 8, 0);
			const to = new Date(2016, 0, 31, 10, 0);
			tool.AWS = {
				listObjects (obj, cb) {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Prefix: 'TEST/history-collection-prefix/2016/01/31/test-collection/'
					});
					cb(new Error('invalid aws'));
				}
			};

			const history = History(tool);
			return expect(history.collectionList(since, to, 'test-collection'))
				.to.eventually.be.rejectedWith(/invalid aws/i);
		});

		it('resolves the list of collections changes', function () {
			const since = new Date(2016, 0, 31, 8, 0);
			const to = new Date(2016, 0, 31, 10, 0);
			tool.AWS = {
				listObjects (obj, cb) {
					cb(null, [{
						Key: 'test-key-1',
						LastModified: (new Date(2016, 0, 31, 6, 30)).toISOString(),
						ETag: 'test-tag'
					}, {
						Key: 'test-key-2',
						LastModified: (new Date(2016, 0, 31, 8, 0)).toISOString(),
						ETag: 'test-tag'
					}]);
				}
			};

			const history = History(tool);
			return expect(history.collectionList(since, to, 'test-collection'))
				.to.eventually.deep.equal([{
					json: [{
						key: 'test-key-1',
						lastModified: new Date(2016, 0, 31, 6, 30),
						etag: 'test-tag'
					}, {
						key: 'test-key-2',
						lastModified: new Date(2016, 0, 31, 8, 0),
						etag: 'test-tag'
					}],
					object: '2016/01/31'
				}]);
		});

		it('filters the list of collections changes', function () {
			const since = new Date(2016, 0, 31, 8, 0);
			const to = new Date(2016, 0, 31, 10, 0);
			tool.AWS = {
				listObjects (obj, cb) {
					cb(null, [{
						Key: 'test-key-1',
						LastModified: (new Date(2016, 0, 31, 6, 30)).toISOString(),
						ETag: 'test-tag'
					}, {
						Key: 'test-key-2',
						LastModified: (new Date(2016, 0, 31, 8, 0)).toISOString(),
						ETag: 'test-tag'
					}, {
						Key: 'test-key-3',
						LastModified: (new Date(2016, 0, 31, 10, 0)).toISOString(),
						ETag: 'test-tag'
					}, {
						Key: 'test-key-4',
						LastModified: (new Date(2016, 0, 31, 10, 0, 1)).toISOString(),
						ETag: 'test-tag'
					}]);
				}
			};

			const history = History(tool);
			return expect(history.collectionList(since, to, 'test-collection', strictlyWithin(since ,to)))
				.to.eventually.deep.equal([{
					json: [{
						key: 'test-key-2',
						lastModified: new Date(2016, 0, 31, 8, 0),
						etag: 'test-tag'
					}, {
						key: 'test-key-3',
						lastModified: new Date(2016, 0, 31, 10, 0),
						etag: 'test-tag'
					}],
					object: '2016/01/31'
				}]);
		});

		it('filters on both ends to the list', function () {
			const since = new Date(2016, 0, 31, 8, 0);
			const to = new Date(2016, 1, 2, 10, 0);
			tool.AWS = {
				listObjects (obj, cb) {
					if (obj.Prefix.indexOf('/01/31/') !== -1) {
						cb(null, [{
							Key: 'test-key-1',
							LastModified: (new Date(2016, 0, 31, 6, 30)).toISOString(),
							ETag: 'test-tag'
						}, {
							Key: 'test-key-2',
							LastModified: (new Date(2016, 0, 31, 8, 0)).toISOString(),
							ETag: 'test-tag'
						}]);
					} else if (obj.Prefix.indexOf('/02/01/') !== -1) {
						cb(null, [{
							Key: 'test-key-3',
							LastModified: (new Date(2016, 1, 1, 12)).toISOString(),
							ETag: 'test-tag'
						}]);
					} else if (obj.Prefix.indexOf('/02/02/') !== -1) {
						cb(null, [{
							Key: 'test-key-4',
							LastModified: (new Date(2016, 1, 2, 10, 0)).toISOString(),
							ETag: 'test-tag'
						}, {
							Key: 'test-key-5',
							LastModified: (new Date(2016, 1, 2, 10, 0, 1)).toISOString(),
							ETag: 'test-tag'
						}]);
					} else {
						cb(new Error('Invalid date'));
					}
				}
			};

			const history = History(tool);
			return expect(history.collectionList(since, to, 'test-collection', strictlyWithin(since ,to)))
				.to.eventually.deep.equal([{
					json: [{
						key: 'test-key-2',
						lastModified: new Date(2016, 0, 31, 8, 0),
						etag: 'test-tag'
					}],
					object: '2016/01/31'
				}, {
					json: [{
						key: 'test-key-3',
						lastModified: new Date(2016, 1, 1, 12, 0),
						etag: 'test-tag'
					}],
					object: '2016/02/01'
				}, {
					json: [{
						key: 'test-key-4',
						lastModified: new Date(2016, 1, 2, 10, 0),
						etag: 'test-tag'
					}],
					object: '2016/02/02'
				}]);
		});

		it('filters on both ends to the list keeping leadind', function () {
			const since = new Date(2016, 0, 31, 8, 0);
			const to = new Date(2016, 1, 1, 10, 0);
			tool.AWS = {
				listObjects (obj, cb) {
					if (obj.Prefix.indexOf('/01/31/') !== -1) {
						cb(null, [{
							Key: 'test-key-1',
							LastModified: (new Date(2016, 0, 31, 5, 0)).toISOString(),
							ETag: 'test-tag'
						}, {
							Key: 'test-key-2',
							LastModified: (new Date(2016, 0, 31, 6, 30)).toISOString(),
							ETag: 'test-tag'
						}, {
							Key: 'test-key-3',
							LastModified: (new Date(2016, 0, 31, 8, 0)).toISOString(),
							ETag: 'test-tag'
						}]);
					} else if (obj.Prefix.indexOf('/02/01/') !== -1) {
						cb(null, [{
							Key: 'test-key-4',
							LastModified: (new Date(2016, 1, 1, 10, 0)).toISOString(),
							ETag: 'test-tag'
						}, {
							Key: 'test-key-5',
							LastModified: (new Date(2016, 1, 1, 12, 0)).toISOString(),
							ETag: 'test-tag'
						}]);
					} else {
						cb(new Error('Invalid date'));
					}
				}
			};

			const history = History(tool);
			return expect(history.collectionList(since, to, 'test-collection', withinLeading(since ,to)))
				.to.eventually.deep.equal([{
					json: [{
						key: 'test-key-2',
						lastModified: new Date(2016, 0, 31, 6, 30),
						etag: 'test-tag'
					}, {
						key: 'test-key-3',
						lastModified: new Date(2016, 0, 31, 8, 0),
						etag: 'test-tag'
					}],
					object: '2016/01/31'
				}, {
					json: [{
						key: 'test-key-4',
						lastModified: new Date(2016, 1, 1, 10, 0),
						etag: 'test-tag'
					}],
					object: '2016/02/01'
				}]);
		});
	});
});
