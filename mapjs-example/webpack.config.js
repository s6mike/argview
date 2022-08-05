/*global require, module, __dirname, process */
const path = require('path');
var webpack = require('webpack');
var default_map_value = 'webpack.config.js: invalid map variable' // '/home/s6mike/git_projects/argmap/examples/example.yml'

module.exports = (env) => {
	// Throws error if no input_map value
	// if (!env.input_map) console.error('ERROR: Invalid input_map ! %s', env.input_map);
	return {
		// stats: 'errors-only',

		// Make all json files external
		// See: https://webpack.js.org/configuration/externals/
		// externals: /\.json$/i,
		// However throws error, testMap seems to become path string rather than json data: https://workflowy.com/#/7a174298da87

		entry: './src/start',
		devtool: 'source-map',
		// context: path.resolve(__dirname, '.'),
		output: {
			filename: '[name].js',
			path: path.resolve(__dirname, 'site/'),
		},
		// plugins: [
		// 	new webpack.DefinePlugin({
		// 		'process.env.input_map': JSON.stringify(env.input_map || default_map_value),
		// 	}),
		// ],
	}
};
