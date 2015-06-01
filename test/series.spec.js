/*jshint -W030 */
var expect = require('chai').expect;
var series = require('../lib/series');

describe('Series', function () {
	it('runs in parallel successfully', function (done) {
		var list = [1, 2, 3, 4, 5],
			doAnAction = function (item, callback) {
				setImmediate(function () {
					callback(null, item + 1);
				});
			};

		series.parallel(list, doAnAction, 2)
		.then(function (results) {
			expect(results).to.deep.equal([{
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

			done();
		})
	});

	it('runs in parallel failing at some point', function (done) {
		var list = [1, 2, 3, 4, 5],
			doAnAction = function (item, callback) {
				setImmediate(function () {
					if (item === 3) {
						callback(new Error('wrong'));
					} else {
						callback(null, item + 1);
					}
				});
			};

		series.parallel(list, doAnAction, 2)
		.catch(function (err) {
			expect(err.message).to.match(/wrong/);

			done();
		})
	});
});
