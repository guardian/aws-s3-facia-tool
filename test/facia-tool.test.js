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

	it('config history', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [
						{Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json'},
						{Key: 'TEST/history/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json'},
						{Key: 'TEST/history/2015-03-26T17:00:00.000Z.someone.here@guardian.co.uk.json'}
					],
					IsTruncated: false
				});
			},
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('22T') > -1) {
					callback(null, {
						Body: '{"collections": {"one": {}}}'
					});
				} else if (obj.Key.indexOf('24T') > -1) {
					callback(null, {
						Body: '{"collections": {"two": {}}}'
					});
				} else if (obj.Key.indexOf('26T') > -1) {
					callback(null, {
						Body: '{"collections": {"three": {}}}'
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.historyConfig().then(function (list) {
			expect(list.length).to.equal(3);
			expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
			expect(list.all[0].config.hasCollection('one')).to.equal(true);
			expect(list.all[1].author).to.equal('another.name@guardian.co.uk');
			expect(list.all[1].config.hasCollection('two')).to.equal(true);
			expect(list.all[2].author).to.equal('someone.here@guardian.co.uk');
			expect(list.all[2].config.hasCollection('three')).to.equal(true);
		});
	});

	it('config history - fail on list', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(new Error('nope'));
			}
		});

		tool.historyConfig().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('config history - fail on bucket', function (done) {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [
						{Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json'}
					],
					IsTruncated: false
				});
			},
			getObject: function (obj, callback) {
				callback(new Error('nope'));
			}
		});

		tool.historyConfig().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});
});