import {expect} from 'chai';
import moment from 'moment';
import aws from '../lib/aws';
import FaciaTool from '../lib/facia-tool';

describe('press', function () {
	var tool;

	beforeEach(function () {
		tool = new FaciaTool({
			pressedPrefix: 'pressed',
			env: 'TEST'
		});
		aws.setCache(false);
	});

	afterEach(function () {
		var AWS = require('aws-sdk');
		aws.setS3(new AWS.S3());
	});


	it('get last modified - generic error', function (done) {
		aws.setS3({
			headObject: function (obj, callback) {
				callback(new Error('something went wrong'));
			}
		});

		tool.press.getLastModified().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('get last modified - not found error', function (done) {
		aws.setS3({
			headObject: function (obj, callback) {
				var error = new Error('Not Found');
				error.statusCode = 404;
				callback(error);
			}
		});

		tool.press.getLastModified().then(function (when) {
			expect(when).to.be.null;
			done();
		});
	});

	it('get last modified - pressed front', function (done) {
		aws.setS3({
			headObject: function (obj, callback) {
				expect(obj.Key).to.equal('TEST/pressed/live/front-id/fapi/pressed.json');
				callback(null, {
					LastModified: moment('2016-02-01 12:34:56').format()
				});
			}
		});

		return tool.press.getLastModified('front-id').then(function (when) {
			expect(when).to.equal('2016-02-01T12:34:56+00:00');
			done();
		});
	});

	it('get last modified - pressed front in draft', function (done) {
		aws.setS3({
			headObject: function (obj, callback) {
				expect(obj.Key).to.equal('TEST/pressed/draft/front-id/fapi/pressed.json');
				callback(null, {
					LastModified: moment('2016-02-01 12:34:56').format()
				});
			}
		});

		return tool.press.getLastModified('front-id' ,'draft').then(function (when) {
			expect(when).to.equal('2016-02-01T12:34:56+00:00');
			done();
		});
	});
});
