import {expect} from 'chai';
import moment from 'moment';
import List  from '../lib/list-configs';

describe('list-configs', function () {
	it('no time', function () {
		const list = new List('ignore', null, [
			{ Key: 'ignore/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
			{ Key: 'ignore/2015-03-20T09:30:00.000Z.another_name@guardian.co.uk.json' }
		]);

		expect(list.length).to.equal(2);
		expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
		expect(list.all[1].author).to.equal('another_name@guardian.co.uk');
		expect(moment('2015-03-22T15:00:00.000Z').isSame(list.all[0].date)).to.equal(true);
		expect(moment('2015-03-20T09:30:00.000Z').isSame(list.all[1].date)).to.equal(true);

		const filtered = list.filter(function (config) {
			return config.author === 'another_name@guardian.co.uk';
		});
		expect(filtered.all[0].author).to.equal('another_name@guardian.co.uk');
		expect(filtered.toString()).to.equal(filtered.all[0].Key);
	});

	it('filters time', function () {
		const list = new List('ignore', new Date('2015-03-20T10:00:00.000Z'), [
			{ Key: 'ignore/2015-03-22T15:00:00.000Z.someone.here@guardian.co.uk.json' },
			{ Key: 'ignore/2015-03-20T09:30:00.000Z.another_name@guardian.co.uk.json' }
		]);

		expect(list.length).to.equal(1);
		expect(list.all[0].author).to.equal('someone.here@guardian.co.uk');
		expect(moment('2015-03-22T15:00:00.000Z').isSame(list.all[0].date)).to.equal(true);
	});
});
