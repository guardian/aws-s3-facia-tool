import {expect} from 'chai';
import cache from '../lib/cache';

describe('cache', function () {
	it('disabled', function () {
		cache.cacheEnabled = false;

		const instance = cache.key('unit_test/something');
		instance.store('text');
		expect(instance.get()).to.be.undefined;
	});

	it('enabled', function () {
		cache.cacheEnabled = true;

		const instance = cache.key('unit_test/something');
		instance.store('{"one": 1}');
		expect(instance.get()).to.deep.equal({ one: 1 });
	});

	it('enabled cache miss', function () {
		cache.cacheEnabled = true;

		const instance = cache.key('unit_test/cache_miss');
		expect(instance.get()).to.be.undefined;
	});
});
