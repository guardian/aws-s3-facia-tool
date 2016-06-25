import {expect} from 'chai';
import {Front, ConfigClass} from '../tmp/bundle.test.js';

describe('Front module', function () {
	const tool = {
		options: Object.freeze({
			bucket: 'test',
			env: 'TEST',
			configKey: 'config',
			collectionsPrefix: 'collection/prefix'
		})
	};

	it('fetch - fails if config is not available', function () {
		tool.AWS = {
			getObject (obj, cb) {
				cb(new Error('invalid config'));
			}
		};
		const front = Front(tool);

		return expect(front.fetch('any'))
			.to.eventually.be.rejectedWith(Error, 'invalid config');
	});

	it('fetch - fails if the front does not exist', function () {
		const configJson = { fronts: {}, collections: {} };
		tool.AWS = {
			getObject (obj, cb) {
				cb(null, configJson);
			}
		};
		const front = Front(tool);

		return expect(front.fetch('any'))
			.to.eventually.be.rejectedWith(Error, /unable to find/i);
	});

	it('fetch - fails if the front does not exist in the provided config', function () {
		const configJson = { fronts: {}, collections: {} };
		tool.AWS = {
			getObject () {
				throw new Error('should not call S3');
			}
		};
		const front = Front(tool);

		return expect(front.fetch('any', new ConfigClass(configJson)))
			.to.eventually.be.rejectedWith(Error, /unable to find/i);
	});

	it('fetch - fails if the provided config is invalid', function () {
		const configJson = { fronts: {}, collections: {} };
		tool.AWS = {
			getObject () {
				throw new Error('should not call S3');
			}
		};
		const front = Front(tool);

		return expect(front.fetch('any', configJson))
			.to.eventually.be.rejectedWith(Error, /invalid config/i);
	});

	it('fetch - returns the front even when a collection fails', function () {
		const configJson = { fronts: {
			first: { someConfig: 'up-here', collections: ['one', 'two'] }
		}, collections: {
			one: { anything: 'here' }, two: {}
		} };
		tool.AWS = {
			getObject (obj, cb) {
				if (obj.Key.indexOf('config') !== -1) {
					cb(null, configJson);
				} else if (obj.Key.indexOf('one') > -1) {
					cb(null, { live: [{ id: 'one' }] });
				} else if (obj.Key.indexOf('two') > -1) {
					cb(new Error('never pressed'));
				} else {
					cb(new Error('not implemented'));
				}
			}
		};

		return Front(tool).fetch('first').then(front => {
			expect(front.toJSON()).to.deep.equal({
				_id: 'first',
				config: { someConfig: 'up-here', collections: ['one', 'two'] },
				collections: [{
					_id: 'one',
					anything: 'here'
				}, {
					_id: 'two'
				}],
				collectionsFull: {
					one: {
						_id: 'one',
						config: {
							_id: 'one',
							anything: 'here'
						},
						collection: {
							live: [{ id: 'one' }]
						}
					},
					two: {
						_id: 'two',
						config: {
							_id: 'two'
						},
						collection: null
					}
				}
			});

			expect(front.collection('one').toJSON()).to.deep.equal({
				_id: 'one',
				config: {
					_id: 'one',
					anything: 'here'
				},
				collection: {
					live: [{ id: 'one' }]
				}
			});
		});
	});

	it('fetch - returns the front ignoring uneditable collections', function () {
		const configJson = { fronts: {
			first: { collections: ['one', 'two'] }
		}, collections: {
			one: { uneditable: true }, two: {}
		} };
		tool.AWS = {
			getObject (obj, cb) {
				if (obj.Key.indexOf('config') !== -1) {
					cb(null, configJson);
				} else if (obj.Key.indexOf('one') > -1) {
					throw new Error('collection one shouldn\'t be fetched');
				} else if (obj.Key.indexOf('two') > -1) {
					cb(new Error('never pressed'));
				} else {
					cb(new Error('not implemented'));
				}
			}
		};

		return Front(tool).fetch('first').then(function (front) {
			expect(front.toJSON()).to.deep.equal({
				_id: 'first',
				config: { collections: ['one', 'two'] },
				collections: [{
					_id: 'one',
					uneditable: true
				}, {
					_id: 'two'
				}],
				collectionsFull: {
					one: {
						_id: 'one',
						config: {
							_id: 'one',
							uneditable: true
						},
						collection: null
					},
					two: {
						_id: 'two',
						config: {
							_id: 'two'
						},
						collection: null
					}
				}
			});

			expect(front.collection('one').toJSON()).to.deep.equal({
				_id: 'one',
				config: {
					_id: 'one',
					uneditable: true
				},
				collection: null
			});
		});
	});
});
