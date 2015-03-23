/*jshint -W030 */
var expect = require('chai').expect;

describe('list-collections', function () {
	var List = require('../lib/list-collections');

	it('filters', function () {
		var list = new List('ignore', [
			{Key: 'ignore/some'},
			{Key: 'ignore/one/collection.json'},
			{Key: 'ignore/another/front/collection.json'}
		]);

		expect(list.length).to.equal(2);
		expect(list.toString()).to.equal('one, another/front');

		var filtered = list.filter(function (collection) {
			return collection.id === 'one';
		});

		expect(filtered.length).to.equal(1);
		expect(filtered.toString()).to.equal('one');
	});
});
