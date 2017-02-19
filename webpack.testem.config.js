/*global require, module, __dirname, process, console */
const path = require('path'),
	fs = require('fs'),
	entries = {},
	testFilter = process.env.npm_package_config_test_filter,
	buildEntries = function () {
		'use strict';
		const startPath = path.resolve(__dirname, 'specs');
		fs.readdirSync(startPath).filter(name => /.+-spec.js/.test(name)).map(x =>path.basename(x, '.js')).forEach(function (f) {
			if (!testFilter || f.indexOf(testFilter) >= 0) {
				entries[f] = `${startPath}/${f}.js`;
			}
		});
	};
console.log('testFilter', testFilter);
buildEntries();

module.exports = {
	entry: entries,
	devtool: 'source-map',
	output: {
		path: path.resolve(__dirname, 'testem', 'compiled'),
		filename: '[name].js'
	}
};
