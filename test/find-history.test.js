import {expect} from 'chai';
import find from '../lib/find-history';

describe('find history', function () {
    const now = new Date(2016, 3, 1, 12, 0);
    const options = {
        bucket: 'test',
        env: 'TEST',
        configHistoryPrefix: 'config-history',
        collectionHistoryPrefix: 'collection-history',
        maxDaysHistory: 2
    };

	it('fails if aws fails', function () {
        const prefixGenerator = (date, options) => {
            expect(date).to.equal('2016/04/01');
            expect(options.bucket).to.equal('test');
            return 'any-prefix';
        };
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                expect(obj).to.deep.equal({
                    Bucket: 'test',
                    Prefix: 'any-prefix'
                });
                cb(new Error('error in aws'));
            }
        }))
        .to.eventually.be.rejectedWith(/error in aws/i);
    });

	it('finds the last data point of today', function () {
        const prefixGenerator = date => date;
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                cb(null, [{
                    Key: '1',
                    LastModified: new Date(2016, 3, 1, 11, 0)
                }, {
                    Key: '2',
                    LastModified: new Date(2016, 3, 1, 11, 59)
                }]);
            }
        }))
        .to.eventually.deep.equal({
            Key: '2',
            LastModified: new Date(2016, 3, 1, 11, 59)
        });
    });

	it('finds the a data point inside today', function () {
        const prefixGenerator = date => date;
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                cb(null, [{
                    Key: '1',
                    LastModified: new Date(2016, 3, 1, 11, 0)
                }, {
                    Key: '2',
                    LastModified: new Date(2016, 3, 1, 15, 0)
                }]);
            }
        }))
        .to.eventually.deep.equal({
            Key: '1',
            LastModified: new Date(2016, 3, 1, 11, 0)
        });
    });

	it('finds something even if there\'s nothing today', function () {
        const prefixGenerator = date => date;
        const calls = [];
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                calls.push(obj.Prefix);
                if (obj.Prefix.indexOf('04/01') !== -1) {
                    cb(null, []);
                } else {
                    cb(null, [{
                        Key: '1',
                        LastModified: new Date(2016, 2, 31, 11, 0)
                    }, {
                        Key: '2',
                        LastModified: new Date(2016, 2, 31, 15, 0)
                    }]);
                }
            }
        }))
        .to.eventually.deep.equal({
            Key: '2',
            LastModified: new Date(2016, 2, 31, 15, 0)
        })
        .and.then(() => {
            expect(calls).to.deep.equal([
                '2016/04/01',
                '2016/03/31'
            ]);
        });
    });

	it('finds something even if today events are all in the future', function () {
        const prefixGenerator = date => date;
        const calls = [];
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                calls.push(obj.Prefix);
                if (obj.Prefix.indexOf('04/01') !== -1) {
                    cb(null, [{
                        Key: '3',
                        LastModified: new Date(2016, 3, 1, 20, 0)
                    }, {
                        Key: '4',
                        LastModified: new Date(2016, 3, 1, 20, 30)
                    }]);
                } else {
                    cb(null, [{
                        Key: '1',
                        LastModified: new Date(2016, 2, 31, 11, 0)
                    }, {
                        Key: '2',
                        LastModified: new Date(2016, 2, 31, 15, 0)
                    }]);
                }
            }
        }))
        .to.eventually.deep.equal({
            Key: '2',
            LastModified: new Date(2016, 2, 31, 15, 0)
        })
        .and.then(() => {
            expect(calls).to.deep.equal([
                '2016/04/01',
                '2016/03/31'
            ]);
        });
    });

	it('finds something few days ago', function () {
        const prefixGenerator = date => date;
        const calls = [];
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                calls.push(obj.Prefix);
                if (obj.Prefix.indexOf('04/01') !== -1) {
                    cb(null, []);
                } else if (obj.Prefix.indexOf('03/31') !== -1) {
                    cb(null, []);
                } else {
                    cb(null, [{
                        Key: '1',
                        LastModified: new Date(2016, 2, 30, 11, 0)
                    }]);
                }
            }
        }))
        .to.eventually.deep.equal({
            Key: '1',
            LastModified: new Date(2016, 2, 30, 11, 0)
        })
        .and.then(() => {
            expect(calls).to.deep.equal([
                '2016/04/01',
                '2016/03/31',
                '2016/03/30'
            ]);
        });
    });

	it('rejects after passing the max date', function () {
        const prefixGenerator = date => date;
        return expect(find(now, prefixGenerator, options, {
            listObjects: (obj, cb) => {
                cb(null, []);
            }
        }))
        .to.eventually.be.rejectedWith(/maxDaysHistory reached/i);
    });
});
