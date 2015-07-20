var expect = require('chai').expect;
var moment = require('moment');

describe('Front', function () {
	var Front = require('../lib/front');
	var Collection = require('../lib/collection');

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
});
