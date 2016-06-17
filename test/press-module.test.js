import {expect} from 'chai';
import moment from 'moment';
import Press from '../modules/press';

import * as aws from '../lib/aws';

describe('press', function () {
	const tool = Object.freeze({
		options: {
			bucket: 'test',
			env: 'TEST',
			pressedPrefix: 'pressed'
		}
	});

	it('get last modified - generic error', function () {
		const press = Press(tool, {
			headObject (obj, callback) {
				callback(new Error('something went wrong'));
			}
		});

		return expect(press.getLastModified())
			.to.eventually.be.rejectedWith(/something went wrong/i);
	});

	it('get last modified - not found error', function () {
		const press = Press(tool, {
			headObject (obj, callback) {
				var error = new Error('Not Found');
				error.statusCode = 404;
				callback(error);
			}
		});

		return expect(press.getLastModified())
			.to.eventually.be.null;
	});

	it('get last modified - pressed front', function () {
		const press = Press(tool, {
			headObject (obj, callback) {
				expect(obj.Key).to.equal('TEST/pressed/live/front-id/fapi/pressed.json');
				callback(null, {
					LastModified: moment('2016-02-01 12:34:56').format()
				});
			}
		});

		return expect(press.getLastModified('front-id'))
			.to.eventually.equal('2016-02-01T12:34:56+00:00');
	});

	it('get last modified - pressed front in draft', function () {
		const press = Press(tool, {
			headObject (obj, callback) {
				expect(obj.Key).to.equal('TEST/pressed/draft/front-id/fapi/pressed.json');
				callback(null, {
					LastModified: moment('2016-02-01 12:34:56').format()
				});
			}
		});

		return expect(press.getLastModified('front-id', 'draft'))
			.to.eventually.equal('2016-02-01T12:34:56+00:00');
	});

	it('fails listing the version', function () {
		const since = new Date(2016, 4, 1, 12);
		const to = new Date(2016, 4, 5, 16);

		const press = Press(tool, {
			listObjectVersions (obj, callback) {
				expect(obj.Prefix).to.equal('TEST/pressed/live/front-id/fapi/pressed.json');
				callback(new Error('some error'));
			}
		});

		return expect(press.listVersions('front-id', 'live', since, to))
			.to.eventually.be.rejectedWith(/some error/i);
	});

	it('lists the versions of a key', function () {
		const press = Press(tool, {
			listObjectVersions (obj, callback) {
				expect(obj.Prefix).to.equal('TEST/pressed/live/front-id/fapi/pressed.json');
				callback(null, [{
					LastModified: moment('2016-05-01 12:00:00').format(),
					VersionId: '1',
					ETag: 'abc',
					IsLatest: false
				}, {
					LastModified: moment('2016-05-05 16:00:00').format(),
					VersionId: '2',
					ETag: 'cde',
					IsLatest: true
				}]);
			}
		});

		return expect(press.listVersions('front-id', 'live'))
			.to.eventually.deep.equal([{
				id: '1',
				lastModified: '2016-05-01T12:00:00+01:00',
				etag: 'abc',
				isLatest: false
			}, {
				id: '2',
				lastModified: '2016-05-05T16:00:00+01:00',
				etag: 'cde',
				isLatest: true
			}]);
	});
});
