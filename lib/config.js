function Config (json) {
    this.json = json;
}

Config.prototype.hasCollection = function (id) {
    return !!this.json.collections[id];
};

module.exports = Config;
