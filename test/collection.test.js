var expect = require('chai').expect;

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
		})
		expect(idCalled).to.deep.equal({
			'live__one': { id: 'one' },
			'draft__one': { id: 'one' },
			'draft__two': { id: 'two', url: 'there' },
			'treats__three': { id: 'three' },
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
		})
		expect(idCalled).to.deep.equal({
			'live__two': { id: 'two' }
		});
	});
});
