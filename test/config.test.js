var expect = require('chai').expect;
var json = require('./samples/config.json');

describe('config', function () {
	var Config = require('../lib/config');

	it('has a collection', function () {
		var instance = new Config(json);

		expect(instance.hasCollection('missing-collection')).to.equal(false);
		expect(instance.hasCollection('83b9699d-a46e-4bfd-91f6-8496ac21b000')).to.equal(true);
	});
});
