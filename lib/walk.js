//
// (c) 2014-02-12 Jens Hauke <jens.hauke@4k2.de>
//

var events = require("events")
, fs = require("fs")
, path = require("path")
, filter = require("./filter");


module.exports = walk;
module.exports.File = File;

function walk(rootDir, options)
{
	var result = ee = new events.EventEmitter();
	var filterList = new filter.FilterList();
	var options = {
	};

	// Add an exclude filter
	result.exclude = function (pattern) {
		filterList.push(filter.create(pattern));
		return result;
	}

	scan(new File(rootDir), filterList, ee, options);

	return result;
}


function getFileType(stats) {
	if (stats.isFile()) return "file";
	else if (stats.isDirectory()) return "dir";
	else if (stats.isSymbolicLink()) return "link";
	else if (stats.isBlockDevice()) return "block";
	else if (stats.isCharacterDevice()) return "char";
	else if (stats.isFIFO()) return "fifo";
	return "unknown";
}


/* Scan for all files in file (dir or file) recursive.
 * Filter entries with filter or array of Filters filter.
 * Call callback(File file) for all accepted files
 */
function scan(file, filter, ee, options)
{
	var scheduled = 0;
	function schedule(cb) {
		scheduled++;
		return function (err, res) {
			cb(err, res);
			if (!--scheduled) ee.emit('done');
		}
	}

	doFile(file, filter);

	function doFile(file, filter, entry) {
		file.lstat(schedule(function (err, stats) {
			if (err) return ee.emit('error', err);

			var type = getFileType(stats);

			// Emit Events
			ee.emit(type, file.path, stats);
			ee.emit('path', file.path, stats, type);

			if (stats.isDirectory()) scanDir(file, entry ? filter : filter.subdir(entry));
		 }));
	}

	function scanDir(file, filter) {
		fs.readdir(file.path, schedule(function(err, list) {
			if (err) return ee.emit('error', err);

			list.forEach(checkEntry);
		}));

		function checkEntry(entry) {
			var nfile = new File(path.join(file.path, entry));

			filter.filter(nfile, schedule(function (doFilter) {
				if (doFilter === true) return ee.emit('filter', nfile.path);
				doFile(nfile, filter, entry);
			}));
		}
	}
}


function File(path)
{
	this.path = path;
}


// Cached version of fs.lstat(this.path, callback)
File.prototype.lstat = function (callback) {
	var file = this;
	fs.lstat(file.path, function (err, stats) {
		// Replace this.lstat() with a version which uses the cached stats.
		file.lstat = function (callback) {
			callback(err, stats);
		}
		callback(err, stats);
	});
}


File.prototype.toString = function () {
	return this.path;
}
