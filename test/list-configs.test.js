/*jshint -W030 */
var expect = require('chai').expect;
var moment = require('moment');

describe('list-configs', function () {
	var List = require('../lib/list-configs');

	it('no time', function () {
		var list = new List('ignore', null, [
			{Key: 'ignore/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json'},
			{Key: 'ignore/2015-03-20T09:30:00.000Z.another_name@guardian.co.uk.json'}
		]);

		expect(list.length).to.equal(2);
		expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
		expect(list.all[1].author).to.equal('another_name@guardian.co.uk');
		expect(list.all[0].date.isSame(moment('2015-03-22T15:00:00.000Z'))).to.equal(true);
		expect(list.all[1].date.isSame(moment('2015-03-20T09:30:00.000Z'))).to.equal(true);

		var filtered = list.filter(function (config) {
			return config.author === 'another_name@guardian.co.uk';
		});
		expect(filtered.all[0].author).to.equal('another_name@guardian.co.uk');
		expect(filtered.toString()).to.equal(filtered.all[0].Key);
	});

	it('filters time', function () {
		var list = new List('ignore', moment('2015-03-20T10:00:00.000Z'), [
			{Key: 'ignore/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json'},
			{Key: 'ignore/2015-03-20T09:30:00.000Z.another_name@guardian.co.uk.json'}
		]);

		expect(list.length).to.equal(1);
		expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
		expect(list.all[0].date.isSame(moment('2015-03-22T15:00:00.000Z'))).to.equal(true);
	});
});
