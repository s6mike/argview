/*global require, module, __dirname */
const path = require('path');
module.exports = {
	entry: './test/start',
	devtool: 'source-map',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'test/')
	},
	devServer: {
		contentBase: path.join(__dirname, 'test'),
		port: 9000
	}
};
