import {expect} from 'chai';
import * as series from '../lib/series';

describe('Series', function () {
	it('runs in parallel successfully', function () {
		var list = [1, 2, 3, 4, 5],
			doAnAction = function (item, callback) {
				setImmediate(function () {
					callback(null, item + 1);
				});
			};

		return expect(series.parallel(list, doAnAction, 2))
			.to.eventually.deep.equal([{
				object: 1,
				json: 2
			}, {
				object: 2,
				json: 3
			}, {
				object: 3,
				json: 4
			}, {
				object: 4,
				json: 5
			}, {
				object: 5,
				json: 6
			}]);
	});

	it('runs in parallel failing at some point', function () {
		const list = [1, 2, 3, 4, 5],
			doAnAction = function (item, callback) {
				setImmediate(function () {
					if (item === 3) {
						callback(new Error('wrong'));
					} else {
						callback(null, item + 1);
					}
				});
			};

		return expect(series.parallel(list, doAnAction, 2))
			.to.eventually.be.rejectedWith(/wrong/);
	});
});
