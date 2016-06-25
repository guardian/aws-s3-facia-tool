import {expect} from 'chai';
import {List} from '../tmp/bundle.test.js';

describe('list module', function () {
	it('at - returns the default value if list is empty', function () {
        const date = new Date(2016, 0, 31);
        const list = List().create([]);

		expect(list.at(date, { default: true })).to.deep.equal({ default: true });
	});

	it('at - returns the default value if nothing matches', function () {
        const date = new Date(2016, 0, 31, 6, 0);
        const list = List().create([{
            json: [{
                key: '1',
                lastModified: (new Date(2016, 0, 31, 12, 30)).toISOString()
            }],
            object: '2016/01/31'
        }]);

		expect(list.at(date, { default: true })).to.deep.equal({ default: true });
	});

	it('at - returns the exact last modified', function () {
        const date = new Date(2016, 0, 31, 6, 0);
        const list = List().create([{
            json: [{
                key: '1',
                lastModified: (new Date(2016, 0, 30, 12, 30)).toISOString()
            }],
            object: '2016/01/30'
        }, {
            json: [{
                key: '2',
                lastModified: (new Date(2016, 0, 31, 4, 0)).toISOString()
            }, {
                key: '3',
                lastModified: (new Date(2016, 0, 31, 5, 59, 59)).toISOString()
            }, {
                key: '4',
                lastModified: (new Date(2016, 0, 31, 6, 0)).toISOString()
            }],
            object: '2016/01/31'
        }]);

		expect(list.at(date, { default: true })).to.deep.equal({
            key: '4',
            lastModified: (new Date(2016, 0, 31, 6, 0)).toISOString()
        });
	});

	it('at - returns the last modified object before date', function () {
        const date = new Date(2016, 0, 31, 6, 0);
        const list = List().create([{
            json: [{
                key: '1',
                lastModified: (new Date(2016, 0, 30, 12, 30)).toISOString()
            }],
            object: '2016/01/30'
        }, {
            json: [{
                key: '2',
                lastModified: (new Date(2016, 0, 31, 4, 0)).toISOString()
            }, {
                key: '3',
                lastModified: (new Date(2016, 0, 31, 6, 0, 1)).toISOString()
            }],
            object: '2016/01/31'
        }]);

		expect(list.at(date, { default: true })).to.deep.equal({
            key: '2',
            lastModified: (new Date(2016, 0, 31, 4, 0)).toISOString()
        });
	});

	it('at - returns the last modified object from a different date', function () {
        const date = new Date(2016, 1, 3);
        const list = List().create([{
            json: [{
                key: '1',
                lastModified: (new Date(2016, 0, 30, 12, 30)).toISOString()
            }],
            object: '2016/01/30'
        }, {
            json: [{
                key: '2',
                lastModified: (new Date(2016, 0, 31, 4, 0)).toISOString()
            }, {
                key: '3',
                lastModified: (new Date(2016, 0, 31, 8, 0)).toISOString()
            }],
            object: '2016/01/31'
        }, {
            json: [{
                key: '4',
                lastModified: (new Date(2016, 1, 1, 19, 0)).toISOString()
            }],
            object: '2016/02/01'
        }]);

		expect(list.at(date, { default: true })).to.deep.equal({
            key: '4',
            lastModified: (new Date(2016, 1, 1, 19, 0)).toISOString()
        });
	});
});
