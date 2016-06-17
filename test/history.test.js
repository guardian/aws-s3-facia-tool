import {expect} from 'chai';
import moment from 'moment';
import FaciaTool from '../lib/facia-tool';

describe('facia-tool history', function () {
	let tool;
	let aws;

	beforeEach(function () {
		tool = new FaciaTool({
			collectionsPrefix: 'collection',
			collectionHistoryPrefix: 'history',
			env: 'TEST',
			configKey: 'please_config.json',
			maxDaysHistory: 4
		});
		aws = tool.AWS;
		aws.setCache(false);
	});

	afterEach(function () {
		var AWS = require('aws-sdk');
		aws.setS3(new AWS.S3());
	});

	it('config', function () {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				callback(null, {
					Contents: [
						{ Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
						{ Key: 'TEST/history/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json' },
						{ Key: 'TEST/history/2015-03-26T17:00:00.000Z.someone.here@guardian.co.uk.json' }
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

		return tool.history.config().then(function (list) {
			expect(list.length).to.equal(3);
			expect(list.all[2].author).to.equal('someone.here@guardian.co.uk');
			expect(list.all[2].config.hasCollection('one')).to.equal(true);
			expect(list.all[1].author).to.equal('another.name@guardian.co.uk');
			expect(list.all[1].config.hasCollection('two')).to.equal(true);
			expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
			expect(list.all[0].config.hasCollection('three')).to.equal(true);
		});
	});

	it('config - fail on list', function (done) {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				callback(new Error('nope'));
			}
		});

		tool.history.config().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('config - fail on bucket', function (done) {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				callback(null, {
					Contents: [
						{ Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' }
					],
					IsTruncated: false
				});
			},
			getObject: function (obj, callback) {
				callback(new Error('nope'));
			}
		});

		tool.history.config().catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('collection - today', function () {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				if (obj.Prefix.indexOf(moment().format('YYYY/MM/DD')) > -1) {
					callback(null, {
						Contents: [
							{
								Key: 'TEST/history/2015/03/22/a-collection/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json',
								LastModified: moment().subtract(20, 'days')
							},
							{
								Key: 'TEST/history/2015/03/24/a-collection/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json',
								LastModified: moment()
							}
						],
						IsTruncated: false
					});
				} else {
					callback(new Error('invalid request'));
				}
			},
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('22T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ live: [{ id: 'one' }] }]
						})
					});
				} else if (obj.Key.indexOf('24T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ live: [{ id: 'one' }], draft: [{ id: 'two' }] }]
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.history.collection('a-collection').then(function (list) {
			expect(list.length).to.equal(2);
		});
	});

	it('collection - since', function () {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				if (obj.Prefix.indexOf(moment().format('YYYY/MM/DD')) > -1) {
					callback(null, {
						Contents: [
							{
								Key: 'TEST/history/2015/03/22/a-collection/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json',
								LastModified: moment()
							},
							{
								Key: 'TEST/history/2015/03/24/a-collection/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json',
								LastModified: moment().subtract(2, 'days')
							}
						],
						IsTruncated: false
					});
				} else if (obj.Prefix.indexOf(moment().subtract(24, 'hours').format('YYYY/MM/DD')) > -1) {
					callback(null, {
						Contents: [
							{
								Key: 'TEST/history/2015/03/26/a-collection/2015-03-26T16:00:00.000Z.another.name@guardian.co.uk.json',
								LastModified: moment().subtract(4, 'hours')
							}
						],
						IsTruncated: false
					});
				} else {
					callback(new Error('invalid request'));
				}
			},
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('22T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ live: [{ id: 'one' }] }]
						})
					});
				} else if (obj.Key.indexOf('24T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ live: [{ id: 'one' }], draft: [{ id: 'two' }] }]
						})
					});
				} else if (obj.Key.indexOf('26T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ live: [{ id: 'one' }, { id: 'two' }] }]
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.history.collection('a-collection', moment().subtract(24, 'hours')).then(function (list) {
			expect(list.length).to.equal(2);
		});
	});

	it('collection - fail missing id', function () {
		return tool.history.collection().catch(function (error) {
			expect(error.message).to.match(/missing collection/i);
		});
	});
});
