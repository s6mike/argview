/*global require, module, __dirname */
const path = require('path');
module.exports = {
	entry: './src/start',
	mode: 'development',
	// TODO: Change so this is set automatically when mode is set
	// Use for development:
	// configuration.devtool should match pattern "^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$".
	devtool: 'eval-cheap-module-source-map',
	
	
	// Use for production:
	// devtool: 'source-map',
	output: {
		filename: 'bundle.js',
		path: path.resolve(__dirname, 'site/js/')
	},
	devServer: {
		static: path.join(__dirname, 'site'),
		port: process.env.PORT_DEV_SERVER,

	}
};
