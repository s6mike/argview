/*global require, module, __dirname, process */
const path = require('path'),
  webpack = require('webpack'), // to access built-in plugins
  // const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin,
  HtmlWebpackPlugin = require('html-webpack-plugin'),
  // CspHtmlWebpackPlugin = require('@melloware/csp-webpack-plugin'),
  { SubresourceIntegrityPlugin } = require('webpack-subresource-integrity');

module.exports = (env, argv) => {
  'use strict';
  return {
    resolve: {
      alias: {
        Mapjs: path.resolve(__dirname, '.'),
      },
      // modules: [path.resolve(__dirname, process.env.MAPJS_NODE_MODULES_PREFIX + '/node_modules'), 'node_modules']
    },
    node: {
      // webpack replaces __dirname with /. It’s a weird default and might cause some hard-to-find bugs.
      //  https://codeburst.io/use-webpack-with-dirname-correctly-4cad3b265a92
      __dirname: false,
    },
    target: 'web', // should be default but just in case
    entry: [path.resolve(__dirname, 'src/start.js')],
    // Use for development:
    // 	configuration.devtool should match pattern "^(inline-|hidden-|eval-)?(nosources-)?(cheap-(module-)?)?source-map$".
    devtool: 'cheap-source-map',
    devtool: (argv.mode === 'production') ? 'source-map' : 'cheap-source-map',
    output: {
      crossOriginLoading: 'anonymous',
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
    plugins: [
      // new BundleAnalyzerPlugin(),
      new SubresourceIntegrityPlugin({
        // The hash functions used (e.g. <script integrity="sha256- ... sha384- ...")
        hashFuncNames: ['sha512'],
        enabled: true,
      }),
      new HtmlWebpackPlugin({
        filename: path.resolve(__dirname, '../' + process.env.PATH_FILE_MAPJS_HTML_DIST_TAGS),
        // Outputs script tags only:
        inject: 'body',
        templateContent: '',
        // cspPlugin: {
        //   enabled: true,
        //   integrityEnabled: true,
        //   hashingMethod: 'sha512',
        //   hashEnabled: {
        //     'script-src': true,
        //     'style-src': true,
        //   },
        //   nonceEnabled: {
        //     'script-src': false,
        //     'style-src': false,
        //   },
        // }
      }),
      new webpack.DefinePlugin({
        // 	'process.env.NODE_ENV' only gets set when server starts, however it is set automatically to argv.mode so no need to define it here.
        // 	'process.env.NODE_ENV': JSON.stringify(argv.mode || process.env.NODE_ENV || 'development'), // Taken from stack exchange but not convinced it's useful
        // PATH_FILE_CONFIG_MAPJS_RELATIVE_SRC: JSON.stringify(process.env.PATH_FILE_CONFIG_MAPJS_RELATIVE_SRC),
        PATH_FILE_CONFIG_MAPJS: JSON.stringify(process.env.PATH_FILE_CONFIG_MAPJS),
        PATH_FILE_CONFIG_MAPJS_PROCESSED: JSON.stringify(process.env.PATH_FILE_CONFIG_MAPJS_PROCESSED),
        // 'process.env.APP_VERSION': JSON.stringify(process.env.npm_package_version),
        // 	Couldn't get this to work:
        // 		PRODUCTION: JSON.stringify(argv.mode === 'production'),
      }),
      // new CspHtmlWebpackPlugin({
      //   'script-src': '',
      //   'style-src': '',
      // }, {
      //   enabled: true,
      //   integrityEnabled: true,
      //   'require-trusted-types-for': ["'script'"],
      //   trustedTypesEnabled: true,
      //   hashingMethod: 'sha512',
      //   hashEnabled: {
      //     'script-src': true,
      //     'style-src': true,
      //   },
      //   nonceEnabled: {
      //     'script-src': false,
      //     'style-src': false,
      //   },
      //   // processFn: defaultProcessFn  // defined in the plugin itself
      // }),
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
        {
          test: /\.ya?ml$/,
          use: 'yaml-loader',
        },
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
                imports: {
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
