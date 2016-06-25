import {expect} from 'chai';
import path from 'path';
import {setCacheEnabled, _cacheKey as key, setCacheBasePath} from '../tmp/bundle.test.js';

describe('cache', function () {
	it('disabled', function () {
		setCacheEnabled(false);

		const instance = key('unit_test/something');
		instance.store('text');
		expect(instance.get()).to.be.undefined;
	});

	it('enabled', function () {
		setCacheEnabled(true);

		const instance = key('unit_test/something');
		instance.store('{"one": 1}');
		expect(instance.get()).to.deep.equal({ one: 1 });
	});

	it('enabled cache miss', function () {
		setCacheEnabled(true);

		const instance = key('unit_test/cache_miss');
		expect(instance.get()).to.be.undefined;
	});

	it('cache path', function () {
		setCacheEnabled(true);
		setCacheBasePath(path.join(__dirname, '/../tmp/nested'));

		const instance = key('unit');
		instance.store('{"one": 1}');
		expect(instance.get()).to.deep.equal({ one: 1 });
	});
});
