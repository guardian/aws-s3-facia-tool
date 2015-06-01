/*jshint -W030 */
var expect = require('chai').expect;
var since = require('../lib/since');
var moment = require('moment');

describe('Since', function () {
	it('returns today when there\'s no parameters', function () {
		var needed = since.needed(null, null);
		expect(needed).to.deep.equal([moment().format('YYYY/MM/DD')]);
	});

	it('returns today if no limit regardless of since', function () {
		var today = moment(),
			yesterday = moment(today).subtract(1, 'days');

		var needed = since.needed(yesterday, null);

		expect(needed).to.deep.equal([today.format('YYYY/MM/DD')]);
	});

	it('returns since if below the limit', function () {
		var today = moment(),
			yesterday = moment(today).subtract(1, 'days'),
			dayBefore = moment(today).subtract(2, 'days');

		var needed = since.needed(dayBefore, 7);

		expect(needed).to.deep.equal([
			dayBefore.format('YYYY/MM/DD'),
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});

	it('returns the limit if since is bigger', function () {
		var today = moment(),
			yesterday = moment(today).subtract(1, 'days'),
			dayBefore = moment(today).subtract(2, 'days');

		var needed = since.needed(dayBefore, 1);

		expect(needed).to.deep.equal([
			yesterday.format('YYYY/MM/DD'),
			today.format('YYYY/MM/DD')
		]);
	});
});
