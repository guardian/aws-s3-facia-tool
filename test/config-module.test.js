import {expect} from 'chai';
import Config from '../modules/config';
import ConfigInstance from '../lib/config';

describe('config module', function () {
	const tool = Object.freeze({
		options: {
			bucket: 'test',
			env: 'TEST',
			configKey: 'config'
		}
	});

	describe('head', function () {
		it('rejects if aws returns errors', function () {
			return expect(Config(tool, {
				headObject: (obj, cb) => {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'TEST/config'
					});
					cb(new Error('aws error'));
				}
			}).head())
			.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			return expect(Config(tool, {
				headObject: (obj, cb) => {
					cb(null);
				}
			}).head())
			.to.eventually.be.fulfilled;
		});
	});

	describe('fetch', function () {
		it('rejects if aws returns errors', function () {
			return expect(Config(tool, {
				getObject: (obj, cb) => {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'TEST/config'
					});
					cb(new Error('aws error'));
				}
			}).fetch())
			.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			return expect(Config(tool, {
				getObject: (obj, cb) => {
					cb(null, { result: 'aws' });
				}
			}).fetch())
			.to.eventually.be.an.instanceof(ConfigInstance);
		});
	});

	describe('get', function () {
		it('access the network if config is not cached', function () {
			let callCount = 0;
			return expect(Config(tool, {
				getObject: (obj, cb) => {
					callCount += 1;
					cb(null, {});
				}
			}).get().then(() => callCount))
			.to.eventually.equal(1);
		});

		it('uses the cache if config is available', function () {
			let callCount = 0;
			const config = Config(tool, {
				getObject: (obj, cb) => {
					callCount += 1;
					cb(null, {});
				}
			});

			return expect(
				config.get()
				.then(() => config.get())
				.then(() => callCount)
			)
			.to.eventually.equal(1);
		});
	});

	describe('json', function () {
		it('returns the config as JSON', function () {
			return expect(Config(tool, {
				getObject: (obj, cb) => {
					cb(null, { json: true });
				}
			}).json())
			.to.eventually.deep.equal({ json: true });
		});
	});

	describe('fetchAt', function () {
		it('rejects if aws returns errors', function () {
			return expect(Config(tool, {
				getObject: (obj, cb) => {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'AT/precise/location'
					});
					cb(new Error('aws error'));
				}
			}).fetchAt('AT/precise/location'))
			.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			return expect(Config(tool, {
				getObject: (obj, cb) => {
					cb(null, { result: 'aws' });
				}
			}).fetchAt('AT/precise/location'))
			.to.eventually.be.an.instanceof(ConfigInstance);
		});
	});
});
