// (c) 2014-02-12 Jens Hauke <jens.hauke@4k2.de>

var util = require('util')
, path = require('path')
, fs = require('fs')
// , Minimatch = require("minimatch").Minimatch; // Minimatch is optional

module.exports = {
	Filter: Filter,
	FilterList: FilterList,
	FilterMinimatch: FilterMinimatch,
	FilterDirmark: FilterDirmark,
	FilterExcludeFile: FilterExcludeFile,
	create: create,
};


/*
 * Filter
 */
function Filter() {
}


/* Apply the filter on file and call the callback(result)
 * result could be:
 * true: Filter this file
 * false: Acceptable file. Continue with other filters.
 * 'accept': Accept the file. (Abort scan through the filter list)
 */
Filter.prototype.filter = function (file, callback) {
	callback(this.filterSync(file));
}


Filter.prototype.filterSync = function (file) {
	return false;
}


/* Create a new filter for subdir dir.
 * Return false, to skip the filter in subdir
 */
Filter.prototype.subdir = function (dir) {
	return this;
}


/*
 * FilterList
 *
 * A list of filters.
 */
function FilterList(filterList)
{
	this.list = filterList || [];
}

FilterList.prototype = new Filter();

FilterList.prototype.filter = function (file, callback) {
	var idx = 0;
	var filterList = this;

	nextFilter(false);

	function nextFilter(doFilter) {
		if ((doFilter === false) && (idx < filterList.list.length)) {
			filterList.list[idx++].filter(file, nextFilter);
		} else {
			callback(doFilter);
		}
	};

}


FilterList.prototype.push = function (filter) {
	if (filter) {
		if (filter instanceof FilterList) {
			// Merge lists
			this.list = this.list.concat(filter.list);
		} else {
			// Append to list
			this.list.push(filter);
		}
	}
}


FilterList.prototype.subdir = function (dir) {
	var fl = new FilterList();
	this.list.forEach(function (filter) {
		fl.push(filter.subdir(dir));
	});
	return fl;
}


/*
 * FilterMinimatch
 *
 * Minimatch pattern to filter paths.
 */
function FilterMinimatch(pattern) {
	var Minimatch = require("minimatch").Minimatch;
	this.mm = new Minimatch(pattern, { dot: true, matchBase: true });
}


FilterMinimatch.prototype = new Filter();


FilterMinimatch.prototype.filterSync = function (file) {
	var fpath = path.normalize('/' + file.path);
	if (this.mm.negate) {
		return this.mm.match(fpath) ? false : 'accept';
	} else {
		return this.mm.match(fpath);
	}
}


/* Empty filter? (Always match?) */
FilterMinimatch.prototype.empty = function () {
	return this.mm.comment || this.mm.empty;
}


/* TBD: Implement
FilterMinimatch.prototype.subdir = function (dir) {
}
*/


/*
 * FilterDirmark
 *
 * Filter directories containing a marker file `filename`.
 */
function FilterDirmark(filename)
{
	this.filename = filename;
}

FilterDirmark.prototype = new Filter();

FilterDirmark.prototype.filter = function (file, callback) {
	var filename = this.filename;

	file.lstat(function (err, stats) {
		if (err) return callback(false);
		if (stats.isDirectory()) {
			var marker = path.join(file.path, filename);

			fs.lstat(marker, function (err, stats) {
				if (err) return callback(false);
				callback(stats.isFile());
			});
		} else {
			callback(false);
		}
	});
}


/*
 * FilterExcludeFile
 *
 * Read exclude patterns from exclude file `filename`
 */
function FilterExcludeFile(filename)
{
	this.filename = filename;

	this._filterlist = new FilterList;
	this._schedule = [];

	var filterFile = this;

	var LineByLineReader = require('line-by-line');

	var lineReader = new LineByLineReader(filename);
	lineReader
		.on('line', function (line) {
			filterFile._filterlist.push(create(line));
		})
		.on('error', startFilter)
		.on('end', startFilter)
	;

	function startFilter() {
		// replace the current filter
		filterFile.filter = function (file, callback) {
			filterFile._filterlist.filter(file, callback);
		}
		// fire the scheduled calls
		filterFile._schedule.forEach(function (callable) { callable(); });
		filterFile._schedule = [];
	}
}

FilterExcludeFile.prototype = new Filter();

FilterExcludeFile.prototype.filter = function (file, callback) {
	// Schedule the callback until all filters are loaded.
	var filterFile = this;
	this._schedule.push(function () {
		filterFile.filter(file, callback);
	});
}


/*
 * Create a Filter from pattern or a list of patterns
 *
 * Minimatch patterns (see Minimatch docu):
 * '*' : Everything except '/'
 * '**' : multiple folder names
 * '*~' : Every ~ file.
 * '/*~' : Every ~ file in the root folder
 * '!blup~' : Accept 'blup~'
 *
 * Special patterns:
 * '$dirmark <filename>' Skip dirs with <filename> in it (e.g. '.nomedia')
 * '$include <filename>' Read patterns from <filename>'
 */
function create(pattern)
{
	if (util.isArray(pattern)) {
		return new FilterList(pattern.map(create).filter(Boolean));
	}

	if (!pattern) return false;

	if (pattern.substr(0, 9) === '$dirmark ') {
		return new FilterDirmark(pattern.substr(9));
	}

	if (pattern.substr(0, 9) === '$include ') {
		return new FilterExcludeFile(pattern.substr(9));
	}

	var filter = new FilterMinimatch(pattern);
	if (filter.empty()) return false;

	return filter;
}
