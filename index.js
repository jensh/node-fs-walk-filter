
var walk = require("./lib/walk");
var filter = require("./lib/filter");

module.exports = {
	walk: walk,
	filter: filter,
};

// Merge with filter
for (var k in filter) {
	module.exports[k] = filter[k];
}
