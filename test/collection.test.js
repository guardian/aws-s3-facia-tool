var expect = require('chai').expect;
var moment = require('moment');

describe('collection', function () {
	var Collection = require('../lib/collection');

	it('iterates on articles', function () {
		var instance = new Collection('collection_id', { collections: {} });
		instance.setContent({
			live: [{ id: 'one' }],
			draft: [{ id: 'one' }, { id: 'two', url: 'there' }],
			treats: [{ id: 'three' }]
		});

		var idCalled = {};
		instance.eachArticle(function (container, article) {
			idCalled[container + '__' + article.id] = article;
		});
		expect(idCalled).to.deep.equal({
			'live__one': { id: 'one' },
			'draft__one': { id: 'one' },
			'draft__two': { id: 'two', url: 'there' },
			'treats__three': { id: 'three' }
		});
	});

	it('iterates on articles only live', function () {
		var instance = new Collection('collection_id', { collections: {} });
		instance.setContent({
			live: [{ id: 'two' }]
		});

		var idCalled = {};
		instance.eachArticle(function (container, article) {
			idCalled[container + '__' + article.id] = article;
		});
		expect(idCalled).to.deep.equal({
			'live__two': { id: 'two' }
		});
	});

	it('finds the fronts containing that collection', function () {
		var config = {
			fronts: {
				'one': {
					collections: ['a', 'b', 'c']
				},
				'two': {
					collections: ['b']
				},
				'three': {
					collections: ['b', 'c', 'd']
				},
				'four': {
					collections: []
				}
			},
			collections: {}
		}, instance, fronts;

		instance = new Collection('a', config);
		fronts = instance.fronts();
		expect(fronts.length).to.equal(1);
		expect(fronts[0].id).to.equal('one');
		expect(fronts[0].allCollections()).to.deep.equal(['a', 'b', 'c']);

		instance = new Collection('b', config);
		fronts = instance.fronts();
		expect(fronts.length).to.equal(3);
		expect(fronts[0].id).to.equal('one');
		expect(fronts[1].id).to.equal('two');
		expect(fronts[2].id).to.equal('three');
		expect(fronts[1].allCollections()).to.deep.equal(['b']);

		instance = new Collection('e', config);
		fronts = instance.fronts();
		expect(fronts.length).to.equal(0);
	});

	it('returns the last modified date', function () {
		var config = {
			fronts: { one: { collections: ['a'] } },
			collections: { a: {} }
		};

		var instance = new Collection('a', config);
		// There's no last modified until we fetch the body
		expect(instance.lastUpdated()).to.equal(null);

		// Missing lastUpdated in body
		instance.setContent({
			updatedBy: 'You'
		});
		expect(instance.lastUpdated()).to.equal(null);

		instance.setContent({
			lastUpdated: 1433154689097
		});
		expect(instance.lastUpdated().isSame('2015-06-01', 'day')).to.be.true;
	});
});
