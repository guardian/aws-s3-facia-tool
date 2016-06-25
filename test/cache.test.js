import {expect} from 'chai';
import path from 'path';
import {_createCache} from '../tmp/bundle.test.js';

describe('cache', function () {
	let cache;
	beforeEach(function () {
		cache = _createCache();
	});

	it('disabled', function () {
		cache.setEnabled(false);

		const instance = cache.key('unit_test/something');
		instance.store('text');
		expect(instance.get()).to.be.undefined;
	});

	it('enabled', function () {
		cache.setEnabled(true);

		const instance = cache.key('unit_test/something');
		instance.store('{"one": 1}');
		expect(instance.get()).to.deep.equal({ one: 1 });
	});

	it('enabled cache miss', function () {
		cache.setEnabled(true);

		const instance = cache.key('unit_test/cache_miss');
		expect(instance.get()).to.be.undefined;
	});

	it('cache path', function () {
		cache.setEnabled(true);
		cache.setBasePath(path.join(__dirname, '/../tmp/nested'));

		const instance = cache.key('unit');
		instance.store('{"one": 1}');
		expect(instance.get()).to.deep.equal({ one: 1 });
	});
});
