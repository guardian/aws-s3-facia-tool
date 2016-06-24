const expect = require('chai').expect;
var Config = require('../modules/config').default;
var ConfigInstance = require('../lib/config').default;

describe('config module', function () {
	const tool = {
		options: Object.freeze({
			bucket: 'test',
			env: 'TEST',
			configKey: 'config'
		})
	};

	describe('head', function () {
		it('rejects if aws returns errors', function () {
			tool.AWS = {
				headObject: (obj, cb) => {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'TEST/config'
					});
					cb(new Error('aws error'));
				}
			};
			return expect(Config(tool).head())
			.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			tool.AWS = {
				headObject: (obj, cb) => {
					cb(null);
				}
			};
			return expect(Config(tool).head())
			.to.eventually.be.fulfilled;
		});
	});

	describe('fetch', function () {
		it('rejects if aws returns errors', function () {
			tool.AWS = {
				getObject: (obj, cb) => {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'TEST/config'
					});
					cb(new Error('aws error'));
				}
			};
			return expect(Config(tool).fetch())
			.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			tool.AWS = {
				getObject: (obj, cb) => {
					cb(null, { result: 'aws' });
				}
			};
			return expect(Config(tool).fetch())
			.to.eventually.be.an.instanceof(ConfigInstance);
		});
	});

	describe('get', function () {
		it('access the network if config is not cached', function () {
			let callCount = 0;
			tool.AWS = {
				getObject: (obj, cb) => {
					callCount += 1;
					cb(null, {});
				}
			};
			return expect(Config(tool).get().then(() => callCount))
			.to.eventually.equal(1);
		});

		it('uses the cache if config is available', function () {
			let callCount = 0;
			tool.AWS = {
				getObject: (obj, cb) => {
					callCount += 1;
					cb(null, {});
				}
			};
			const config = Config(tool);

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
			tool.AWS = {
				getObject: (obj, cb) => {
					cb(null, { json: true });
				}
			};
			return expect(Config(tool).json())
			.to.eventually.deep.equal({ json: true });
		});
	});

	describe('fetchAt', function () {
		it('rejects if aws returns errors', function () {
			tool.AWS = {
				getObject: (obj, cb) => {
					expect(obj).to.deep.equal({
						Bucket: 'test',
						Key: 'AT/precise/location'
					});
					cb(new Error('aws error'));
				}
			};
			return expect(Config(tool).fetchAt('AT/precise/location'))
			.to.eventually.be.rejectedWith(Error, 'aws error');
		});

		it('resolves if aws is fine', function () {
			tool.AWS = {
				getObject: (obj, cb) => {
					cb(null, { result: 'aws' });
				}
			};
			return expect(Config(tool).fetchAt('AT/precise/location'))
			.to.eventually.be.an.instanceof(ConfigInstance);
		});
	});
});
