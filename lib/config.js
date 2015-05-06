var jsonQuery = require('sift');

function Config (json) {
    this.json = json;

    this.fronts = utility(this, 'fronts');
    this.collections = utility(this, 'collections');
}

Config.prototype.hasCollection = function (id) {
    return !!this.json.collections[id];
};

Config.prototype.front = function (front) {
	return this.json.fronts[front];
};

Config.prototype.collection = function (id) {
	return this.json.collections[id];
};

function utility (config, key) {
	var allValues = null;

	function find (query) {
		query = query || {};

		if (!allValues) {
			allValues = Object.keys(config.json[key]).map(function (front) {
				return config.json[key][front];
			});
		}

		return jsonQuery(query, allValues);
	}

	return {
		find: find
	};
}

module.exports = Config;
