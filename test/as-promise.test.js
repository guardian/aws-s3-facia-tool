import {expect} from 'chai';
import {_promise as promise} from '../tmp/bundle.test.js';

describe('as promise', function () {

	it('rejects if action throws an error', function () {
		return expect(promise(() => {
			throw new Error('in the action');
		})).to.eventually.be.rejectedWith(Error, 'in the action');
	});

	it('rejects if action callback has an error', function () {
		return expect(promise((cb) => {
			cb(new Error('error from action'));
		})).to.eventually.be.rejectedWith(Error, 'error from action');
	});

	it('resolves with the result of the callback', function () {
		return expect(promise((cb) => {
			cb(null, { ok : true });
		})).to.eventually.deep.equal({ ok : true });
	});
});
