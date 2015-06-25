var expect = require('chai').expect;

describe('cache', function () {
	var cache = require('../lib/cache');

	it('disabled', function () {
		cache.cacheEnabled = false;

		var instance = cache.key('unit_test/something');
		instance.store('text');
		expect(instance.get()).to.be.undefined;
	});

	it('enabled', function () {
		cache.cacheEnabled = true;

		var instance = cache.key('unit_test/something');
		instance.store('{"one": 1}');
		expect(instance.get()).to.deep.equal({ one: 1 });
	});
});
