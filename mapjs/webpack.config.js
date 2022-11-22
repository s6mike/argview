/*global require, module, __dirname, process */
const path = require('path');
// const BundleAnalyzerPlugin =
// 	require("webpack-bundle-analyzer").BundleAnalyzerPlugin
module.exports = {
	entry: './src/start',
	mode: 'development',
	// TODO: Change so this is set automatically when mode is set
	// Use for development:
	// configuration.devtool should match pattern "^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$".
	devtool: 'eval-cheap-module-source-map',
	// plugins: [new BundleAnalyzerPlugin()],
	// Use for production:
	// devtool: 'source-map',
	module: {
		rules: [
			{
				test: require.resolve('jquery.hotkeys'),
				use: [
					{
						loader: 'imports-loader',
						options: {
							// Replacing: require('imports-loader?jQuery=jquery!jquery.hotkeys');
							type: 'commonjs',
							imports:
							{
								syntax: 'single',
								moduleName: 'jquery',
								name: 'jQuery'
							}
						}
					}
				]
			}
		]
	},
	output: {
		filename: '[name].bundle.js',
		// chunkFilename: "[name].chunk.js",
		path: path.resolve(__dirname, 'site/js/')
	},

	// optimization: {
	// 	splitChunks: {
	// 		chunks: 'all',
	// 	},
	// },

	devServer: {
		static: path.join(__dirname, 'site'),
		port: process.env.PORT_DEV_SERVER
	}
};
