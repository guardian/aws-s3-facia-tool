var expect = require('chai').expect;
var json = require('./samples/config.json');
var jsonFind = require('./samples/configFind.json');

describe('config', function () {
	var Config = require('../lib/config');

	it('has a collection', function () {
		var instance = new Config(json);

		expect(instance.hasCollection('missing-collection')).to.equal(false);
		expect(instance.hasCollection('83b9699d-a46e-4bfd-91f6-8496ac21b000')).to.equal(true);
		expect(instance.front('uk')).to.deep.equal({
			'collections': [
				'9e0d5e94-3f24-4f0f-bdd5-bdd07aff6838',
				'b4051e8c-9d75-4ef9-b3da-18f11a20b41c',
				'b951b658-5b69-4890-91fd-5b50b500f61c',
				'3b6c3b04-0f6e-4679-80f6-97967de8eb61'
			]
		});
		expect(instance.collection('83b9699d-a46e-4bfd-91f6-8496ac21b000')).to.deep.equal({
			'displayName': 'External links',
			'type': 'nav/list'
		});
	});

	it('finds a front', function () {
		var instance = new Config(jsonFind);
		var allResults = Object.keys(jsonFind.fronts).map(function (key) {
			return jsonFind.fronts[key];
		});

		expect(instance.fronts.find()).to.deep.equal(allResults);
		expect(instance.fronts.find({})).to.deep.equal(allResults);
		expect(instance.fronts.find({
			a: 'text'
		})).to.deep.equal([jsonFind.fronts.one, jsonFind.fronts.five]);
		expect(instance.fronts.find({
			a: { $in: ['text', 'string'] }
		})).to.deep.equal([jsonFind.fronts.one, jsonFind.fronts.four, jsonFind.fronts.five]);
		expect(instance.fronts.find({
			a: 'text',
			c: 20
		})).to.deep.equal([jsonFind.fronts.five]);
		expect(instance.fronts.find({
			$or: [ { a: 'string' }, { c: 20 } ]
		})).to.deep.equal([jsonFind.fronts.four, jsonFind.fronts.five]);
		// This doesn't work on sift
		// expect(instance.fronts.find({
		// 	'b': ['c1', 'c2', 'c3']
		// })).to.deep.equal([jsonFind.fronts.three]);
		expect(instance.fronts.find({
			'b': 'c1'
		})).to.deep.equal([jsonFind.fronts.three, jsonFind.fronts.six]);
		// This doesn't work on sift
		// expect(instance.fronts.find({
		// 	'b.0': 'c1'
		// })).to.deep.equal([jsonFind.fronts.three]);
		expect(instance.fronts.find({
			'a': { $regex: /text/ }
		})).to.deep.equal([jsonFind.fronts.one, jsonFind.fronts.two, jsonFind.fronts.five]);
	});

	it('finds a collection', function () {
		var instance = new Config(jsonFind);

		expect(instance.collections.find({
			a: 'some'
		})).to.deep.equal([jsonFind.collections.one]);
	});
});
