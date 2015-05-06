/*jshint -W030 */
var expect = require('chai').expect;
var moment = require('moment');

describe('facia-tool', function () {
	var aws = require('../lib/aws');
	var FaciaTool = require('../lib/facia-tool');

	var tool;

	beforeEach(function () {
		tool = new FaciaTool({
			collectionsPrefix: 'collection',
			env: 'TEST',
			configKey: 'please_config.json'
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
						{ Key: 'some-key' },
						{ Key: 'TEST/collection/one/collection.json' },
						{ Key: 'TEST/collection/two/collection.json' },
						{ Key: 'TEST/collection/three/collection.json' }
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
						{ Key: 'TEST/collection/one/collection.json' }
					],
					IsTruncated: false
				});
			}
		});

		return tool.listCollections().then(function (list) {
			aws.setS3({
				getObject: function (obj, callback) {
					callback(null, {
						Body: '{"live": [{ "id": "one" }]}'
					});
				}
			});

			return tool.fetchCollections(list).then(function (collections) {
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
						{ Key: 'TEST/collection/one/collection.json' }
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

		return tool.historyConfig().then(function (list) {
			expect(list.length).to.equal(3);
			expect(list.all[2].author).to.equal('someone.here@guardian.co.uk');
			expect(list.all[2].config.hasCollection('one')).to.equal(true);
			expect(list.all[1].author).to.equal('another.name@guardian.co.uk');
			expect(list.all[1].config.hasCollection('two')).to.equal(true);
			expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
			expect(list.all[0].config.hasCollection('three')).to.equal(true);
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
						{ Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' }
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

	it('front', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
				callback(null, {
					Contents: [
						{ Key: 'TEST/history/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
						{ Key: 'TEST/history/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json' }
					],
					IsTruncated: false
				});
			},
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('22T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: {}, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else if (obj.Key.indexOf('24T') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: {}, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: {}, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.front({
			front: 'uk'
		}).then(function (front) {
			expect(front.allCollectionsEver()).to.deep.equal(['one', 'two']);
		});
	});

	it('find collections', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
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
			listObjects: function (obj, callback) {
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

	it('history collection - today', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
				if (obj.Prefix.indexOf(moment().format('YYYY/MM/DD')) > -1) {
					callback(null, {
						Contents: [
							{ Key: 'TEST/collection/history/2015/03/22/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
							{ Key: 'TEST/collection/history/2015/03/24/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json' }
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

		return tool.historyCollection('a-collection').then(function (list) {
			expect(list.length).to.equal(1);
		});
	});

	it('history collection - since', function () {
		aws.setS3({
			listObjects: function (obj, callback) {
				if (obj.Prefix.indexOf(moment().format('YYYY/MM/DD')) > -1) {
					callback(null, {
						Contents: [
							{ Key: 'TEST/collection/history/2015/03/22/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
							{ Key: 'TEST/collection/history/2015/03/24/2015-03-24T16:00:00.000Z.another.name@guardian.co.uk.json' }
						],
						IsTruncated: false
					});
				} else if (obj.Prefix.indexOf(moment().subtract(24, 'hours').format('YYYY/MM/DD')) > -1) {
					callback(null, {
						Contents: [
							{ Key: 'TEST/collection/history/2015/03/26/2015-03-26T16:00:00.000Z.another.name@guardian.co.uk.json' }
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

		return tool.historyCollection('a-collection', moment().subtract(24, 'hours')).then(function (list) {
			expect(list.length).to.equal(2);
		});
	});
});
