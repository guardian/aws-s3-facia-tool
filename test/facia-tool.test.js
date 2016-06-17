import {expect} from 'chai';
import moment from 'moment';
import FaciaTool from '../lib/facia-tool';

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
			listObjectsV2: function (obj, callback) {
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
			listObjectsV2: function (obj, callback) {
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
			listObjectsV2: function (obj, callback) {
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
			listObjectsV2: function (obj, callback) {
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
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('one') > -1) {
					callback(null, {
						Body: JSON.stringify({
							live: [{ id: 'one' }]
						})
					});
				} else if (obj.Key.indexOf('two') > -1) {
					callback(new Error('never pressed'));
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { anything: 'here' }, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.front('uk').then(function (front) {
			expect(front.toJSON()).to.deep.equal({
				_id: 'uk',
				config: { collections: ['one', 'two'] },
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

	it('front - doesn\'t exist', function () {
		aws.setS3({
			getObject: function (obj, callback) {
				callback(null, {
					Body: JSON.stringify({
						collections: { one: {}, two: {} },
						fronts: { uk: { collections: ['one', 'two'] } }
					})
				});
			}
		});

		return tool.front('au/missing/front').catch(function (error) {
			expect(error.message).to.match(/Unable to find/i);
		});
	});

	it('front with uneditable collections', function () {
		aws.setS3({
			getObject: function (obj, callback) {
				if (obj.Key.indexOf('one') > -1) {
					throw new Error('collection one shouldn\'t be fetched');
				} else if (obj.Key.indexOf('two') > -1) {
					callback(new Error('never pressed'));
				} else if (obj.Key.indexOf('please_config') > -1) {
					callback(null, {
						Body: JSON.stringify({
							collections: { one: { uneditable: true }, two: {} },
							fronts: { uk: { collections: ['one', 'two'] } }
						})
					});
				} else {
					callback(new Error('nope'));
				}
			}
		});

		return tool.front('uk').then(function (front) {
			expect(front.toJSON()).to.deep.equal({
				_id: 'uk',
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
			expect(us.allCollections()).to.deep.equal(['two']);
			expect(uk.allCollections()).to.deep.equal(['one', 'two']);
			expect(us.lastUpdated()).to.be.null;
			expect(uk.lastUpdated().isSame(moment('2015-07-01', 'YYYY-MM-DD'), 'days')).to.be.true;
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
			expect(us.allCollections()).to.deep.equal(['two']);
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
			expect(us.allCollections()).to.deep.equal(['one']);
		});
	});
});
