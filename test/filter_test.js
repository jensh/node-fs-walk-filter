var assert = require('assert');
var walk = require('../').walk;
var filter = require('../').filter;

describe('Walker', function() {
	it('walk is a function', function () {
		assert(typeof walk === 'function');
	});
	it('walk() return an event emitter and exclude functions', function () {
		var w = walk('.');
		assert(typeof w === 'object');
		assert(typeof w.exclude === 'function', 'walk(".").exclude() is a Function');
		assert(typeof w.on === 'function', 'walk(".").on() is a Function');
	});
});

describe('Filter', function() {
	it('filter exports', function () {
		assert(typeof filter === 'object', 'filter is an object');
	});

	describe('FilterMinimatch', function() {
		var list = [
			/* MiniMatch patterns */
			{
				pattern: '*',
				match: [ '1', '/x', '.x', 'a/b/c' ],
				nomatch: [ '.', './.', '' ],
			},
			{
				pattern: '!*',
				accept: [ '1' ],
				nomatch: [ '.', './.', ''],
			},
			{
				pattern: '/*',
				match: [ '1', '/x', '.x'],
				nomatch: [ '.', './.', '', 'a/b/c' ],
			},
			{
				pattern: 'a',
				match: [ 'a', 'b/a' ],
				nomatch: [ 'a/x', 'b' ],
			},
			{
				pattern: '/a',
				match: [ 'a' ],
				nomatch: [ 'b', 'b/a', 'a/x' ],
			},
			{
				pattern: '/x/**/y',
				match: [ 'x/y', 'x/a/y', 'x/a/b/y' ],
				nomatch: [ 'a/x/b/c/y', 'b/a', 'a/x' ],
			},
			{
				pattern: '/x/*/y',
				match: [  'x/a/y' ],
				nomatch: [ 'x/y', 'x/a/b/y', 'a/x/b/c/y', 'b/a', 'a/x' ],
			},
			{
				pattern: 'x/*/y',
				match: [  'x/a/y' ],
				nomatch: [ 'x/y', 'x/a/b/y', 'a/x/b/c/y', 'b/a', 'a/x' ],
			},
			{
				pattern: '/*/y',
				match: [  'x/y' ],
				nomatch: [ 'x/a/b/y', 'a/x/b/c/y', 'b/a', 'a/x' ],
			},
			{
				pattern: '**/y',
				match: [ 'y', 'x/y', 'a/b/y' ],
				nomatch: [ 'x/a/b/y/c', 'b/a', 'a' ],
			},
			{
				pattern: [ 'a', 'b', '!ca*', 'd', 'c*' ],
				match: [ 'a', 'b', 'd', 'cb', 'c' ],
				accept: [ 'ca', 'cax' ],
				nomatch: [ 'e', 'aa', 'bb' ],
			},
			/* FilterDirmark */
			{
				pattern: '$dirmark walk.js',
				match: ['lib' ],
				nomatch: ['test', 'test/blub', 'lib/x' ],
			},
			/* FilterExcludeFile */
			{
				pattern: '$include test/filter_test.exclude',
				match: [ 'a', 'b', 'cb', 'c' ],
				accept: [ 'ca', 'cax' ],
				nomatch: [ 'e', 'aa', 'bb', 'd' ],
			},
			{ // No File like empty file.
				pattern: '$include test/no_file',
				nomatch: [ 'x' ],
			},
		];
		list.forEach(function (patternDesc) {
			function check(path, expect) {
				it('Pattern "' + patternDesc.pattern +
				   '" path "' + path +
				   '" expect ' + expect, function (done) {
					   var f = new filter.create(patternDesc.pattern);
					   f.filter(new walk.File(path), function (result) {
						   assert.strictEqual(result, expect);
						   done();
					   });
				   });
			}

			function forEach(list, cb) {
				if (!list) return;
				list.forEach(cb);
			};

			forEach(patternDesc.match, function (path) {
				check(path, true);
			});

			forEach(patternDesc.nomatch, function (path) {
				check(path, false);
			});

			forEach(patternDesc.accept, function (path) {
				check(path, 'accept');
			});
		});
	});
});
