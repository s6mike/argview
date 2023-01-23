/*global require, module, __dirname, process */
const path = require('path'),
	webpack = require('webpack'), // to access built-in plugins	
	// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin,
	HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
	return {
		target: 'web', // should be default but just in case
		entry: [path.resolve(__dirname, 'src/start.js')],
		// Use for development:
		// 	configuration.devtool should match pattern "^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$".
		devtool: 'eval-cheap-module-source-map',
		// devtool: (argv.mode === 'production') ? 'source-map' : 'eval-cheap-module-source-map',
		output: {
			path: path.resolve(__dirname, 'public/js/'),
			// TODO: use more robust publicPath
			//	 publicPath: path.resolve(__dirname, 'public/js/'),
			publicPath: '/js/',
			// Setting filename as anything except '[name].js' breaks one of HMR/watch mode/live reloading
			//  Think watch mode may have fixed this but then get warning when running server
			//  TODO: either solve this or set this name in production only:
			// filename: '[name].[contenthash].bundle.js',
			chunkFilename: '[name].[contenthash].bundle.js', // This is used for on-demand-loaded chunk files.
			clean: true,
		},
		// resolve: { modules: [path.resolve(__dirname, 'src'), 'node_modules'] },
		// resolve: {
		// 	modules: [path.resolve(__dirname, 'src'), 'node_modules'],
		// 	alias: { yaml: 'yaml-loader', Src: path.resolve(__dirname, 'src') },
		// },
		// resolveLoader: {
		// 	alias: { yaml: 'yaml-loader', Src: path.resolve(__dirname, 'src') },
		// 	modules: [path.resolve(__dirname, 'src'), 'node_modules'],
		// 	extensions: ['.yml', '.yaml'],
		// },
		// stats: 'minimal',
		// See here for how to customise stats output more precisely: https://stackoverflow.com/questions/30756804/webpack-silence-output#answer-37664373
		stats: 'errors-warnings',
		devServer: {
			static: path.join(__dirname, 'public'),
			port: process.env.PORT_DEV_SERVER,
			client: {
				overlay: false,
				progress: false,
			},
			// watchFiles: ['src/**.js'],
		},
		// This doesn't seem to have had any effect:
		// watchOptions: {
		// 	ignored: '*.yml',
		// },
		plugins: [
			// new BundleAnalyzerPlugin(),
			new HtmlWebpackPlugin({
				// QUESTION: Would it be better to be using path.resolve and relative path, instead of absolute path?
				// 	Could use realpath to generate the relative path
				// filename: path.resolve(__dirname, '../src/layouts/includes/webpack-dist-tags.html'),
				filename: process.env.PATH_MJS_HTML_DIST_TAGS + '/webpack-dist-tags.html',
				// Outputs script tags only:
				inject: 'body',
				templateContent: '',
			}),
			new webpack.DefinePlugin({
			// 	'process.env.NODE_ENV' only gets set when server starts, however it is set automatically to argv.mode so no need to define it here.
			// 	'process.env.NODE_ENV': JSON.stringify(argv.mode || process.env.NODE_ENV || 'development'), // Taken from stack exchange but not convinced it's useful
				// PATH_FILE_CONFIG_MJS_RELATIVE_SRC: JSON.stringify(process.env.PATH_FILE_CONFIG_MJS_RELATIVE_SRC),
				PATH_FILE_CONFIG_MJS: JSON.stringify(process.env.PATH_FILE_CONFIG_MJS),
			// 	'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
			// 'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
			// 	Couldn't get this to work:
			// 		PRODUCTION: JSON.stringify(argv.mode === 'production'),
			}),
		],
		performance: {
			hints: false
		},
		optimization: {
			moduleIds: 'deterministic',
			splitChunks: {
				chunks: 'all',
				name: 'vendor',
				// minSize: 10000,
				// // production warning is at 244 KiB = 31232
				// maxSize: 31232
			},
		},
		module: {
			rules: [
				// {
				// 	test: /\.ya?ml$/,
				// 	// include: path.resolve('src/config-mapjs.yml'),
				// 	// type: 'javascript/auto',
				// 	// type: 'json',
				// 	// enforce: 'pre',
				// 	use: 'yaml-loader',
				// },	
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
};
