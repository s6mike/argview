/*global require, module, __dirname */
const path = require('path');
module.exports = {
	entry: './src/start',
	// TODO: Change so this is set automatically when mode is set
	// Use for development:
	devtool: 'cheap-module-eval-source-map',
	// Use for production:
	// devtool: 'source-map',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'site/js/')
	},
	devServer: {
		contentBase: path.join(__dirname, 'site'),
		port: process.env.PORT_DEV_SERVER
	}
};
