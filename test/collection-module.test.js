import {expect} from 'chai';
import Collection from '../modules/collection';
import CollectionInstance from '../lib/collection';

describe('collection module', function () {
	const tool = Object.freeze({
		options: {
			bucket: 'test',
			env: 'TEST',
			collectionsPrefix: 'collection'
		}
	});

	describe('fetch', function () {
		it('rejects if aws returns errors', function () {
            const collection = Collection(tool, {
                getObject (obj, cb) {
                    expect(obj).to.deep.equal({
                        Bucket: 'test',
                        Key: 'TEST/collection/id/collection.json'
                    });
                    cb(new Error('aws error'));
                }
            });

			return expect(collection.fetch('id'))
                .to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
            const collection = Collection(tool, {
                getObject (obj, cb) {
                    cb(null, {});
                }
            });
			return expect(collection.fetch('id'))
                .to.eventually.be.an.instanceof(CollectionInstance);
		});
	});

	describe('fetchAt', function () {
		it('rejects if aws returns errors', function () {
            const collection = Collection(tool, {
                getObject (obj, cb) {
                    expect(obj).to.deep.equal({
                        Bucket: 'test',
                        Key: 'HERE/id'
                    });
                    cb(new Error('aws error'));
                }
            });

			return expect(collection.fetchAt('id', 'HERE/id'))
                .to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
            const collection = Collection(tool, {
                getObject (obj, cb) {
                    cb(null, { raw: true });
                }
            });
			return expect(collection.fetchAt('id', 'HERE/id'))
                .to.eventually.be.an.instanceof(CollectionInstance)
				.then(collection => {
					expect(collection.raw).to.deep.equal({ raw: true });
				});
		});
	});
});
