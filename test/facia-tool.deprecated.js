const expect = require('chai').expect;
var moment = require('moment');
var FaciaTool = require('../lib/facia-tool').default;

describe('facia-tool', function () {
	let tool;
	let aws;

	beforeEach(function () {
		tool = new FaciaTool({
			collectionsPrefix: 'collection',
			env: 'TEST',
			configKey: 'please_config.json'
		});
		aws = tool.AWS;
		aws.setCache(false);
	});

	afterEach(function () {
		var AWS = require('aws-sdk');
		aws.setS3(new AWS.S3());
	});

	it('fetch collection', function () {
		aws.setS3({
			getObject: function (obj, callback) {
				var id = obj.Key.replace('/collection.json', '').split('/').pop();
				callback(null, {
					Body: JSON.stringify({
						live: [{ id: id }]
					})
				});
			}
		});

		return tool.fetchCollection('first').then(function (collection) {
			expect(collection.id).to.equal('first');
			expect(collection.raw).to.deep.equal({
				live: [{ id: 'first' }]
			});
		});
	});

	it('fetch collection - fail', function (done) {
		aws.setS3({
			getObject: function (obj, callback) {
				callback(new Error('collection missing'));
			}
		});

		tool.fetchCollection('non_existing').catch(function (err) {
			expect(err).to.be.instanceof(Error);
			done();
		});
	});

	it('find collections', function () {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				callback(null, {
					Contents: [
						{ Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
						{ Key: 'TEST/history/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json' }
					],
					IsTruncated: false
				});
			},
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('one') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ id: 'first' }]
						})
					});
				} else if (obj.Key.indexOf('two') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ id: 'second' }]
						})
					});
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { num: 1 }, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.findCollections(['one', 'two', 'missing']).then(function (list) {
			expect(list.length).to.equal(2);
			expect(list[0].config.num).to.equal(1);
			expect(list[0].raw.live[0].id).to.equal('first');
			expect(list[1].raw.draft[0].id).to.equal('second');
		});
	});

	it('find all collections', function () {
		aws.setS3({
			listObjectsV2: function (obj, callback) {
				callback(null, {
					Contents: [
						{ Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
						{ Key: 'TEST/history/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json' }
					],
					IsTruncated: false
				});
			},
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('one') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ id: 'first' }]
						})
					});
				} else if (obj.Key.indexOf('two') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ id: 'second' }]
						})
					});
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { num: 1 }, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.findCollections().then(function (list) {
			expect(list.length).to.equal(2);
			expect(list[0].config.num).to.equal(1);
			expect(list[0].raw.live[0].id).to.equal('first');
			expect(list[1].raw.draft[0].id).to.equal('second');
		});
	});

	it('fetches a list of fronts', function () {
		aws.setS3({
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('one') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ id: 'first' }],
							lastUpdated: moment('2015-07-01', 'YYYY-MM-DD').valueOf()
						})
					});
				} else if (obj.Key.indexOf('two') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ id: 'second' }]
						})
					});
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { num: 1 }, two: {} },
							fronts: {
								uk: { collections: ['one', 'two'] },
								us: { collections: ['two'] }
							}
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.fetchFronts().then(function (fronts) {
			expect(fronts.length).to.equal(2);
			var us = fronts[0].id === 'us' ? fronts[0] : fronts[1],
				uk = fronts[0].id === 'uk' ? fronts[0] : fronts[1];

			expect(us.id).to.equal('us');
			expect(uk.id).to.equal('uk');
			expect(us.listCollectionsIds()).to.deep.equal(['two']);
			expect(uk.listCollectionsIds()).to.deep.equal(['one', 'two']);
			expect(us.lastUpdated()).to.be.null;
			expect(moment(uk.lastUpdated()).isSame(moment('2015-07-01', 'YYYY-MM-DD'), 'days')).to.be.true;
		});
	});

	it('fetches a filtered list of fronts', function () {
		aws.setS3({
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('one') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ id: 'first' }],
							lastUpdated: moment('2015-07-01', 'YYYY-MM-DD').valueOf()
						})
					});
				} else if (obj.Key.indexOf('two') > -1) {
					callback(null, {
						Body: JSON.stringify({
							draft: [{ id: 'second' }]
						})
					});
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { num: 1 }, two: {} },
							fronts: {
								uk: { collections: ['one', 'two'] },
								us: { collections: ['two'] }
							}
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.fetchFronts(['us', 'banana']).then(function (fronts) {
			expect(fronts.length).to.equal(1);
			var us = fronts[0];

			expect(us.id).to.equal('us');
			expect(us.listCollectionsIds()).to.deep.equal(['two']);
		});
	});

	it('fetches a list of fronts with no pressed collections', function () {
		aws.setS3({
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { num: 1 }, two: {} },
							fronts: {
								us: { collections: [ 'one' ] }
							}
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.fetchFronts().then(function (fronts) {
			expect(fronts.length).to.equal(1);
			var us = fronts[0];

			expect(us.id).to.equal('us');
			expect(us.listCollectionsIds()).to.deep.equal(['one']);
		});
	});
});
