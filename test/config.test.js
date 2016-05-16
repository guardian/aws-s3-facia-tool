import {expect} from 'chai';
import _ from 'lodash';
import json from './samples/config.json';
import jsonFind from './samples/configFind.json';
import Config from '../lib/config';

describe('config', function () {
	it('has a collection', function () {
		var instance = new Config(json);

		expect(instance.hasCollection('missing-collection')).to.equal(false);
		expect(instance.hasCollection('83b9699d-a46e-4bfd-91f6-8496ac21b000')).to.equal(true);
		var front = instance.front('uk').toJSON();
		expect(front).to.deep.equal({
			'_id': 'uk',
			'config': {
				'collections': [
					'9e0d5e94-3f24-4f0f-bdd5-bdd07aff6838',
					'b4051e8c-9d75-4ef9-b3da-18f11a20b41c',
					'b951b658-5b69-4890-91fd-5b50b500f61c',
					'3b6c3b04-0f6e-4679-80f6-97967de8eb61'
				]
			},
			'collections': [
				_.assign({
					'_id': '9e0d5e94-3f24-4f0f-bdd5-bdd07aff6838'
				}, json.collections['9e0d5e94-3f24-4f0f-bdd5-bdd07aff6838']),
				_.assign({
					'_id': 'b4051e8c-9d75-4ef9-b3da-18f11a20b41c'
				}, json.collections['b4051e8c-9d75-4ef9-b3da-18f11a20b41c']),
				_.assign({
					'_id': 'b951b658-5b69-4890-91fd-5b50b500f61c'
				}, json.collections['b951b658-5b69-4890-91fd-5b50b500f61c']),
				_.assign({
					'_id': '3b6c3b04-0f6e-4679-80f6-97967de8eb61'
				}, json.collections['3b6c3b04-0f6e-4679-80f6-97967de8eb61'])
			],
			'collectionsFull': {}
		});
		expect(instance.collection('83b9699d-a46e-4bfd-91f6-8496ac21b000').toJSON().config).to.deep.equal({
			'displayName': 'External links',
			'type': 'nav/list'
		});
	});

	it('has a front', function () {
		var instance = new Config(json);

		expect(instance.hasFront('uk')).to.be.true;
		expect(instance.hasFront('two')).to.be.true;
		expect(instance.hasFront('banana')).to.be.false;
	});

	it('finds a front', function () {
		var instance = new Config(jsonFind);
		var allResults = Object.keys(jsonFind.fronts).map(function (key) {
			return key;
		});
		var getId = function (results) {
			return results.map(function (front) {
				return front.toJSON()._id;
			});
		};

		expect(getId(instance.fronts.find())).to.deep.equal(allResults);
		expect(getId(instance.fronts.find({}))).to.deep.equal(allResults);
		expect(getId(instance.fronts.find({
			'config.a': 'text'
		}))).to.deep.equal(['one', 'five']);
		expect(getId(instance.fronts.find({
			'config.a': { $in: ['text', 'string'] }
		}))).to.deep.equal(['one', 'four', 'five']);
		expect(getId(instance.fronts.find({
			'config.a': 'text',
			'config.c': 20
		}))).to.deep.equal(['five']);
		expect(getId(instance.fronts.find({
			$or: [ { 'config.a': 'string' }, { 'config.c': 20 } ]
		}))).to.deep.equal(['four', 'five']);
		expect(getId(instance.fronts.find({
			'config.b': 'c1'
		}))).to.deep.equal(['three', 'six']);
		expect(getId(instance.fronts.find({
			'config.a': { $regex: /text/ }
		}))).to.deep.equal(['one', 'two', 'five']);
	});

	it('finds a collection', function () {
		var instance = new Config(jsonFind);
		var toJSON = function (results) {
			return results.map(function (collection) {
				return collection.toJSON();
			});
		};

		expect(toJSON(instance.collections.find({
			'config.collection.live.id': 'b'
		}))).to.deep.equal([{
			'_id': 'one',
			config: jsonFind.collections.one,
			collection: null
		}]);
	});

	it('lists ids', function () {
		var config = new Config({
			fronts: {
				afront: {},
				bfront: {}
			},
			collections: {
				collection: {}
			}
		});
		expect(config.listFrontsIds()).to.deep.equal(['afront', 'bfront']);
		expect(config.listCollectionsIds()).to.deep.equal(['collection']);
	});
});
