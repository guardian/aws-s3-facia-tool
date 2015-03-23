/*jshint -W030 */
var expect = require('chai').expect;

describe('facia-tool', function () {
	var aws = require('../lib/aws');
	var FaciaTool = require('../lib/facia-tool');

	var tool;

	beforeEach(function () {
		tool = new FaciaTool({
			collectionsPrefix: 'collection',
			env: 'TEST'
		});
		aws.setCache(false);
	});

	afterEach(function () {
		var AWS = require('aws-sdk');
		aws.setS3(new AWS.S3());
	});

	it('fetches the config', function (done) {
		aws.setS3({
			getObject: function (obj, callback) {
				callback(null, {
					Body: '{"collections": {"one": {}}}'
				});
			}
		});

		tool.fetchConfig().then(function (config) {
			expect(config.hasCollection('one')).to.equal(true);
			done();
		});
	});

	it('fetches the config - fail', function (done) {
		aws.setS3({
			getObject: function (obj, callback) {
				callback(new Error('nope'));
			}
		});

		tool.fetchConfig().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('lists collections', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [
						{Key: 'some-key'},
						{Key: 'TEST/collection/one/collection.json'},
						{Key: 'TEST/collection/two/collection.json'},
						{Key: 'TEST/collection/three/collection.json'}
					],
					IsTruncated: false
				});
			}
		});

		return tool.listCollections().then(function (list) {
			expect(list.toString()).to.equal('one, two, three');
		});
	});

	it('lists collections - fail', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(new Error('nope'));
			}
		});

		tool.listCollections().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('fetch collections', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [
						{Key: 'TEST/collection/one/collection.json'}
					],
					IsTruncated: false
				});
			}
		});

		return tool.listCollections().then(function () {
			aws.setS3({
				getObject: function (obj, callback) {
					callback(null, {
						Body: '{"live": [{ "id": "one" }]}'
					});
				}
			});

			return tool.fetchCollections().then(function (collections) {
				expect(collections.length).to.equal(1);
				var iterate = {};
				collections[0].eachArticle(function (container, article) {
					iterate[container + '__' + article.id] = article;
				});
				expect(iterate).to.deep.equal({
					'live__one': {
						id: 'one'
					}
				});
			});
		});
	});

	it('fetch collections - fail', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [
						{Key: 'TEST/collection/one/collection.json'}
					],
					IsTruncated: false
				});
			}
		});

		return tool.listCollections().then(function () {
			aws.setS3({
				getObject: function (obj, callback) {
					callback(new Error('nope'));
				}
			});

			return tool.fetchCollections().catch(function (err) {
				expect(err).to.be.instanceof(Error);
				done();
			});
		});
	});
});