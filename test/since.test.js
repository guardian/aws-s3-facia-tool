import {expect} from 'chai';
import moment from 'moment';
import * as since from '../lib/since';

const today = moment();
const yesterday = moment(today).subtract(1, 'days');
const dayBefore = moment(today).subtract(2, 'days');

describe('Since needed', function () {
	it('returns today when there\'s no parameters', function () {
		const needed = since.needed(null, null);
		expect(needed).to.deep.equal([moment().format('YYYY/MM/DD')]);
	});

	it('returns today if no limit regardless of since', function () {
		const needed = since.needed(yesterday, null);
		expect(needed).to.deep.equal([today.format('YYYY/MM/DD')]);
	});

	it('returns since if below the limit', function () {
		const needed = since.needed(dayBefore, 7);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns the limit if since is bigger', function () {
		const needed = since.needed(dayBefore, 1);
		expect(needed).to.deep.equal([
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});
});

describe('Since between', function () {
	it('returns today when there\'s no parameters', function () {
		const needed = since.datesBetween(null, null, null);
		expect(needed).to.deep.equal([moment().format('YYYY/MM/DD')]);
	});

	it('returns today if no limit regardless of since', function () {
		const needed = since.datesBetween(yesterday, null);
		expect(needed).to.deep.equal([today.format('YYYY/MM/DD')]);
	});

	it('returns since if below the limit', function () {
		const needed = since.datesBetween(dayBefore, null, 7);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns the limit if since is bigger', function () {
		const needed = since.datesBetween(dayBefore, null, 1);
		expect(needed).to.deep.equal([
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns days between if below the limit', function () {
		const needed = since.datesBetween(dayBefore, yesterday, 7);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD')
		]);
	});

	it('returns days between if there is no since', function () {
		const needed = since.datesBetween(null, yesterday, 1);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD')
		]);
	});
});
