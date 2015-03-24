function Config (json) {
    this.json = json;
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

module.exports = Config;
