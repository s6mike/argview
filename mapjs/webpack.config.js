/*global require, module, __dirname, process */
const path = require('path');
module.exports = {
	watch: true,
	entry: [path.resolve(__dirname, 'src/start')],
	mode: 'development',
	// mode: 'production',
	// TODO: Change so this is set automatically when mode is set
	// Use for development:
	// configuration.devtool should match pattern "^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$".
	devtool: 'eval-cheap-module-source-map',
	// plugins: [new BundleAnalyzerPlugin()],
	// Use for production:
	// devtool: 'source-map',
	output: {
		filename: '[name].bundle.js',
		// chunkFilename: "[name].chunk.js",
		path: path.resolve(__dirname, 'site/js/'),
		clean: true,
	},
	// optimization: {
	// 	splitChunks: {
	// 		chunks: 'all',
	// 		name: 'vendor',
	// 		// minSize: 10000,
	// 		// maxSize: 250000,
	// 	},
	// },
	devServer: {
		static: path.join(__dirname, 'site'),
		port: process.env.PORT_DEV_SERVER,
		watchFiles: ['src/**.js'],
	},
	module: {
		rules: [
			{
				test: require.resolve('jquery-hammerjs/jquery.hammer-full.js'),
				loader: 'exports-loader',
				options: {
					type: 'commonjs',
					exports: {
						syntax: 'single',
						name: 'Hammer',
					},
				},
			},
			{
				test: require.resolve('jquery.hotkeys'),
				use: [
					{
						loader: 'imports-loader',
						options: {
							type: 'commonjs',
							imports:
							{
								syntax: 'single',
								moduleName: 'jquery',
								name: 'jQuery',
							},
						},
					},
				],
			},
		],
	},
};
