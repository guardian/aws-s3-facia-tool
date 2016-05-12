import {expect} from 'chai';
import moment from 'moment';
import History from '../modules/history';

describe('history module', function () {
	const tool = Object.freeze({
		options: {
			bucket: 'test',
			env: 'TEST',
			configKey: 'config',
            configHistoryPrefix: 'history-prefix'
		}
	});

    describe('configList', function () {
        it('fails if since is not specified', function () {
            const history = History(tool, {});

            return expect(history.configList(null, null))
                .to.eventually.be.rejectedWith(/missing .* parameter/i);
        });

        it('fails if to is not specified', function () {
            const date = moment(new Date(2016, 0, 31));
            const history = History(tool, {});

            return expect(history.configList(date, null))
                .to.eventually.be.rejectedWith(/missing .* parameter/i);
        });

        it('fails if aws fails', function () {
            const date = moment(new Date(2016, 0, 31));
            const history = History(tool, {
                listObjects (obj, cb) {
                    expect(obj).to.deep.equal({
                        Bucket: 'test',
                        Prefix: 'TEST/history-prefix/2016/01/31/'
                    });
                    cb(new Error('invalid aws'));
                }
            });

            return expect(history.configList(date, date))
                .to.eventually.be.rejectedWith(/invalid aws/i);
        });

        it('resolves with aws list', function () {
            const since = moment(new Date(2016, 0, 31));
            const to = moment(new Date(2016, 1, 1));
            const calls = [];

            const history = History(tool, {
                listObjects (obj, cb) {
                    calls.push(obj.Prefix);
                    cb(null, [{
                        Key: 'test-key-' + obj.Prefix.substr(-3, 2),
                        LastModified: 'never',
                        ETag: 'test-tag'
                    }]);
                }
            });

            return expect(history.configList(since, to))
                .to.eventually.deep.equal([{
                    json: [{
                        key: 'test-key-31',
                        lastModified: 'never',
                        etag: 'test-tag'
                    }],
                    object: '2016/01/31'
                }, {
                    json: [{
                        key: 'test-key-01',
                        lastModified: 'never',
                        etag: 'test-tag'
                    }],
                    object: '2016/02/01'
                }])
                .then(() => {
                    expect(calls).to.deep.equal([
                        'TEST/history-prefix/2016/01/31/',
                        'TEST/history-prefix/2016/02/01/'
                    ]);
                });
        });
    });
});
