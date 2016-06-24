const expect = require('chai').expect;
var Collection = require('../modules/collection').default;
var CollectionInstance = require('../lib/collection').default;

describe('collection module', function () {
	const tool = {
		options: Object.freeze({
			bucket: 'test',
			env: 'TEST',
			collectionsPrefix: 'collection'
		})
	};

	describe('fetch', function () {
		it('rejects if aws returns errors', function () {
			tool.AWS = {
				getObject (obj, cb) {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'TEST/collection/id/collection.json'
					});
					cb(new Error('aws error'));
				}
			};
			const collection = Collection(tool);

			return expect(collection.fetch('id'))
				.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			tool.AWS = {
				getObject (obj, cb) {
					cb(null, {});
				}
			};
			const collection = Collection(tool);
			return expect(collection.fetch('id'))
				.to.eventually.be.an.instanceof(CollectionInstance);
		});
	});

	describe('fetchAt', function () {
		it('rejects if aws returns errors', function () {
			tool.AWS = {
				getObject (obj, cb) {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'HERE/id'
					});
					cb(new Error('aws error'));
				}
			};
			const collection = Collection(tool);

			return expect(collection.fetchAt('id', 'HERE/id'))
				.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			tool.AWS = {
				getObject (obj, cb) {
					cb(null, { raw: true });
				}
			};
			const collection = Collection(tool);
			return expect(collection.fetchAt('id', 'HERE/id'))
				.to.eventually.be.an.instanceof(CollectionInstance)
				.then(collection => {
					expect(collection.raw).to.deep.equal({ raw: true });
				});
		});
	});

	describe('list', function () {
		it('rejects if aws returns errors', function () {
			tool.AWS = {
				listObjects (obj, cb) {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Prefix: 'TEST/collection'
					});
					cb(new Error('aws error'));
				}
			};
			const collection = Collection(tool);

			return expect(collection.list())
				.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			tool.AWS = {
				listObjects (obj, cb) {
					cb(null, [{
						Key: 'TEST/collection/abcd/collection.json',
						LastModified: new Date(2016, 4, 1),
						ETag: '123'
					}, {
						Key: 'TEST/collection/one/two/three/collection.json',
						LastModified: new Date(2016, 4, 2),
						ETag: '234'
					}]);
				}
			};
			const collection = Collection(tool);
			return expect(collection.list())
				.to.eventually.deep.equal([{
					key: 'TEST/collection/abcd/collection.json',
					lastModified: new Date(2016, 4, 1),
					etag: '123',
					collectionId: 'abcd'
				}, {
					key: 'TEST/collection/one/two/three/collection.json',
					lastModified: new Date(2016, 4, 2),
					etag: '234',
					collectionId: 'one/two/three'
				}]);
		});
	});
});
