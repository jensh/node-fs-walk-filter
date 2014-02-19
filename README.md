# fs-walk-filter

Walk the filesystem and emit Events for each inode. Filter directories
or files with asynchronous exclude filters.

## Usage

**`walk(dir, [options])`**

```javascript
var walk = require('fs-walk-filter').walk;


walk('.')
	.exclude('*~')
	.exclude('node_modules')
	.exclude('.git')
	.on('path', function (path, stats, type) {
		console.log(type, path);
	})
	.on('file', function (path, stats) {
		console.log('FILE', path);
	})
	.on('error', function (err) {
		console.error(err);
	});
```

## Features

Emits the following events while walking:

- 'path'(path, stats, type):
	inode with the path `path`, `stats` from
	`fs.lstat(path)` and `type` in ["file", "dir", "link",
	"block", "char", "fifo" ]
- 'file'(path, stats):
	a file.
- 'dir'(path, stats):
	a directory.
- 'link'(path, stats):
	a symbolic link.
- 'block'(path, stats):
	a block device.
- 'char'(path, stats):
	a character device.
- 'filter'(path):
	a filtered path.
- 'done'
	when done
- 'error'(error):
	an error

## Using filters

The '.exclude' accepts a pattern, a filter or an array of those.

To chain multiple filters use

* multiple '.exclude()'
```javascript
walk('.')
	.exclude('*~')
	.exclude('*.o')
```

* an array of patterns or filters
```javascript
walk('.')
	.exclude(['*~', '*.o', new filter.FilterDirmark('.nomedia')])
```

## Filters

### filter.FilterMinimatch(pattern)

Supports these glob features to exclude files or dirs:

* Brace Expansion
* Extended glob matching
* "Globstar" `**` matching

provided by Minimatch https://www.npmjs.org/package/minimatch

See:

* `man sh`
* `man bash`
* `man 3 fnmatch`
* `man 5 gitignore`

Example:
```javascript
walk('.').exclude('*~')
```

Matching negative patterns (starting with '!') will accept the path
without further testing.

### filter.FilterExcludeFile(filename)

Use the filter pattern '$include <filename>' to include all filters read
from the file <filename> line by line.

Example:
```javascript
walk('.').exclude('$include .gitignore')
```

### filter.FilterDirmark(filename)

Use the filter pattern '$dirmark <filename>' to exclude all
directories containing the file <filename>.

Example:
```javascript
walk('.').exclude('$include .nomedia')
```
