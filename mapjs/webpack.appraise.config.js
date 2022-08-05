/*global require, module, __dirname */
const path = require('path');
module.exports = {
	entry: './examples/assets/webpack-main',
	output: {
		filename: 'webpack-bundle.js',
		path: path.resolve(__dirname, 'examples', 'assets')
	}
};
