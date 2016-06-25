import {expect} from 'chai';
import moment from 'moment';
import {_needed, _datesBetween} from '../tmp/bundle.test.js';

const today = moment();
const yesterday = moment(today).subtract(1, 'days');
const dayBefore = moment(today).subtract(2, 'days');

describe('Since needed', function () {
	it('returns today when there\'s no parameters', function () {
		const result = _needed(null, null);
		expect(result).to.deep.equal([moment().format('YYYY/MM/DD')]);
	});

	it('returns today if no limit regardless of since', function () {
		const result = _needed(yesterday.toDate(), null);
		expect(result).to.deep.equal([today.format('YYYY/MM/DD')]);
	});

	it('returns since if below the limit', function () {
		const result = _needed(dayBefore.toDate(), 7);
		expect(result).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns the limit if since is bigger', function () {
		const result = _needed(dayBefore.toDate(), 1);
		expect(result).to.deep.equal([
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});
});

describe('Since between', function () {
	it('returns today when there\'s no parameters', function () {
		const needed = _datesBetween(null, null, null);
		expect(needed).to.deep.equal([moment().format('YYYY/MM/DD')]);
	});

	it('returns today if no limit regardless of since', function () {
		const needed = _datesBetween(yesterday.toDate(), null);
		expect(needed).to.deep.equal([today.format('YYYY/MM/DD')]);
	});

	it('returns since if below the limit', function () {
		const needed = _datesBetween(dayBefore.toDate(), null, 7);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns the limit if since is bigger', function () {
		const needed = _datesBetween(dayBefore.toDate(), null, 1);
		expect(needed).to.deep.equal([
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns days between if below the limit', function () {
		const needed = _datesBetween(dayBefore.toDate(), yesterday.toDate(), 7);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD')
		]);
	});

	it('returns days between if there is no since', function () {
		const needed = _datesBetween(null, yesterday.toDate(), 1);
		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD')
		]);
	});
});
