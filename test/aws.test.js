import {expect} from 'chai';
import cache from '../lib/cache';
import aws from '../lib/aws';

describe('aws', function () {

	beforeEach(function () {
		aws.setCache(false);
	});

	afterEach(function () {
		var AWS = require('aws-sdk');
		aws.setS3(new AWS.S3());
	});

	it('get a single object - error', function (done) {
		aws.setS3({
			getObject: function (obj, callback) {
				callback(new Error('something wrong'));
			}
		});

		aws.getObject({
			Key: 'unit_test/some_bucket'
		}, function (err) {
			expect(err).to.be.an.instanceof(Error);
			done();
		});
	});

	it('get a single object - works fine', function (done) {
		aws.setS3({
			getObject: function (obj, callback) {
				callback(null, {
					Body: '{"one": 1}'
				});
			}
		});

		aws.getObject({
			Key: 'unit_test/some_bucket'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal({
				one: 1
			});
			done();
		});
	});

	it('lists objects - error', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(new Error('something bad'));
			}
		});

		aws.listObjects({
			Prefix: 'unit_test/history'
		}, function (err) {
			expect(err).to.be.an.instanceof(Error);
			done();
		});
	});

	it('lists objects - works in one call', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [{one: 1}, {two: 2}],
					IsTruncated: false
				});
			}
		});

		aws.listObjects({
			Prefix: 'unit_test/history'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal([
				{one: 1},
				{two: 2}
			]);
			done();
		});
	});

	it('lists objects - works in multiple calls', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				aws.setS3({
					listObjects: function (next, back) {
						back(null, {
							Contents: [{Key: 3}, {hasMarker: !!next.Marker}],
							IsTruncated: false
						});
					}
				});

				callback(null, {
					Contents: [{Key: 1}, {Key: 2}],
					IsTruncated: true
				});
			}
		});

		aws.listObjects({
			Prefix: 'unit_test/history'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal([
				{Key: 1},
				{Key: 2},
				{Key: 3},
				{hasMarker: true}
			]);
			done();
		});
	});

	it('head object - error', function (done) {
		aws.setS3({
			headObject: function (obj, callback) {
				callback(new Error('something wrong'));
			}
		});

		aws.headObject({
			Key: 'unit_test/head_object'
		}, function (err) {
			expect(err).to.be.an.instanceof(Error);
			done();
		});
	});

	it('head - works fine', function (done) {
		aws.setS3({
			headObject: function (obj, callback) {
				callback(null, {
					LastModified: 'long time ago'
				});
			}
		});

		aws.headObject({
			Key: 'unit_test/head_object'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal({
				LastModified: 'long time ago'
			});
			done();
		});
	});

	it('get an object - cache', function (done) {
		aws.setCache(true);
		const instance = cache.key('aws_test/1');
		instance.store('{ "any" : true }');
		aws.setS3({
			getObject () {
				throw new Error('Should not call S3');
			}
		});

		aws.getObject({
			Key: 'aws_test/1'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal({
				any: true
			});
			done();
		});
	});

	it('head an object - cache', function (done) {
		aws.setCache(true);
		const instance = cache.key('aws_test/2');
		instance.store('{ "any" : false }');
		aws.setS3({
			headObject () {
				throw new Error('Should not call S3');
			}
		});

		aws.headObject({
			Key: 'aws_test/2'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal({
				any: false
			});
			done();
		});
	});

	it('list objects - cache', function (done) {
		aws.setCache(true);
		const instance = cache.key('aws_test/3');
		instance.store(JSON.stringify([{ num: 1}]));
		aws.setS3({
			listObjects () {
				throw new Error('Should not call S3');
			}
		});

		aws.listObjects({
			Prefix: 'aws_test/3'
		}, function (err, data) {
			expect(err).to.be.null;
			expect(data).to.deep.equal([
				{ num: 1 }
			]);
			done();
		});
	});
});
