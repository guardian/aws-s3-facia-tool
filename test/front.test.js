import {expect} from 'chai';
import moment from 'moment';
import Front from '../lib/front';
import Collection from '../lib/collection';

describe('Front', function () {
	it('computes the last modified date', function () {
		var config = {
			fronts: { something: {} },
			collections: {}
		};

		var front = new Front('something', config);
		expect(front.lastUpdated()).to.equal(null);

		var one = new Collection('one', config),
			two = new Collection('two', config),
			three = new Collection('three', config),
			four = new Collection('four', config);

		one.setContent({
			// never updated
		});
		two.setContent({
			lastUpdated: moment('25-06-2015', 'DD-MM-YYYY')
		});
		three.setContent({
			lastUpdated: moment('12-05-2015', 'DD-MM-YYYY')
		});
		four.setContent({
			lastUpdated: moment('01-07-2015', 'DD-MM-YYYY')
		});

		front.setCollection('one', one);
		expect(front.lastUpdated()).to.equal(null);

		front.setCollection('two', two);
		expect(front.lastUpdated().isSame(moment('25-06-2015', 'DD-MM-YYYY'), 'day')).to.be.true;

		front.setCollection('three', three);
		expect(front.lastUpdated().isSame(moment('25-06-2015', 'DD-MM-YYYY'), 'day')).to.be.true;

		front.setCollection('four', four);
		expect(front.lastUpdated().isSame(moment('01-07-2015', 'DD-MM-YYYY'), 'day')).to.be.true;
	});

	it('returns the priority', function () {
		var config = {
			fronts: {
				one: {
					priority: 'banana'
				},
				two: {}
			},
			collections: {}
		};

		var one = new Front('one', config),
			two = new Front('two', config);

		expect(one.priority()).to.equal('banana');
		expect(two.priority()).to.equal('editorial');
	});

	it('fails in list of trails if collections are missing', function () {
		const config = {
			fronts: {
				one: {
					collections: ['first', 'second', 'third']
				}
			},
			collections: {}
		};
		const front = new Front('one', config);
		expect(() => front.trailIds('live')).to.throw(/missing collection content/i);
	});

	it('returns the list of trails', function () {
		const config = {
			fronts: {
				one: {
					collections: ['first', 'second', 'third']
				}
			},
			collections: {}
		};
		const front = new Front('one', config);
		const [first, second, third] = [
			new Collection('first', config),
			new Collection('second', config),
			new Collection('third', config)
		];
		first.setContent({
			live: [{ id: 'a' }], draft: [{ id: 'a' }, { id: 'b' }]
		});
		second.setContent({
			live: [], draft: [{ id: 'c'}]
		});
		third.setContent({
			live: [{ id: 'd' }, { id: 'a' }, { id: 'e' }], treats: [{ id: 'f' }]
		});
		front.setCollection('first', first);
		front.setCollection('second', second);
		front.setCollection('third', third);
		expect(front.trailIds('live')).to.deep.equal(['a', 'd', 'e']);
		expect(front.trailIds('draft')).to.deep.equal(['a', 'b', 'c']);
		expect(front.trailIds('treats')).to.deep.equal(['f']);
		expect(front.trailIds('what??')).to.deep.equal([]);
	});
});
