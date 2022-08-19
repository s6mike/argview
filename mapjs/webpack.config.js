/*global require, module, __dirname */
const path = require('path');
module.exports = {
	entry: './src/start',
	devtool: 'source-map',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'site/js/')
	},
	devServer: {
		contentBase: path.join(__dirname, 'site'),
		port: process.env.PORT_DEV_SERVER
	}
};
