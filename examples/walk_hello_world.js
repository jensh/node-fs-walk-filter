#!/usr/bin/env node
//
// (c) 2014-02-12 Jens Hauke <jens.hauke@4k2.de>
//
var walk = require('../').walk;


walk('..')
	.exclude('*~')
	.exclude('node_modules')
	.exclude('.git')
	.on('path', function (path, stats, type) {
		console.log(type, path);
	})
/*
	.on('file', function (path, stats) {
		console.log('FILE', path);
	})
*/
	.on('error', function (err) {
		console.error(err);
	});


// Local Variables:
//  compile-command: "./walk_hello_world.js"
// End:
