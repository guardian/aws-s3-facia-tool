/*jshint -W030 */
var expect = require('chai').expect;

describe('aws', function () {
	var aws = require('../lib/aws');

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

});
