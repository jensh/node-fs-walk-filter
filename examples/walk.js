#!/usr/bin/env node
//
// (c) 2014-02-12 Jens Hauke <jens.hauke@4k2.de>
//
var walk = require('../').walk;
var program = require('commander');


var exclude = [];

function argAppendExclude(val) {
	exclude.push(val)
	return exclude;
}

function argAppendExcludeFrom(file) {
	argAppendExclude('$include ' + file);
}

program
	.version('0.0.1')
	.option('--exclude <pattern>', 'Exclude pattern', argAppendExclude)
	.option('--exclude-from <file>', 'Exclude patterns from file', argAppendExcludeFrom)
	.option('-v, --verbose', 'Be more verbose (debug)')
	.option('--stat', 'Print stats for each file')
	.parse(process.argv);

if (!program.args.length) program.args = ['.']

if (program.verbose) {
	console.log('Exclude:');
	exclude.forEach(function (pattern) {
		console.log('  ' + pattern);
	});
	console.log('Dirs: ' + program.args);
}

if (program.stat) {
	var printer = function (path, stats, type) {
		console.log(path +
			    '\t' + type +
			    '\t' + stats.size +
			    '\t' + stats.mtime);
	}
} else {
	var printer = function (path) {
		console.log(path);
	};
}


program.args.forEach(function (rootDir) {
	walk(rootDir)
		.exclude(exclude)
		.on('path', printer)
		.on('error', console.error)
	;
});

// Local Variables:
//  compile-command: "./walk.js --exclude '*~' --stat"
// End:
