/* global module */
// Karma configuration
// Generated on Mon Jan 09 2017 02:10:18 GMT+0100 (CET)
module.exports = function (config) {
	'use strict';
	config.set({
		// base path that will be used to resolve all patterns (eg. files, exclude)
		basePath: '',


		// frameworks to use
		// available frameworks: https://npmjs.org/browse/keyword/karma-adapter
		frameworks: ['jasmine'],


		// list of files / patterns to load in the browser
		files: [
			'specs/helpers/*.js',
			'specs/*-spec.js'
		],


		// list of files to exclude
		exclude: [
		],


		// preprocess matching files before serving them to the browser
		// available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
		preprocessors: {
			'specs/**/*.js': ['webpack', 'sourcemap']
		},

		webpack: {
			devtool: 'inline-source-map'
		},

		webpackMiddleware: {
			// webpack-dev-middleware configuration
			// i.e.
			noInfo: true,
			stats: 'errors-only'
		},

		//plugins: [ require('karma-webpack'), require('karma-jasmine'), require('karma-chrome-launcher') ],

		// test results reporter to use
		// possible values: 'dots', 'progress'
		// available reporters: https://npmjs.org/browse/keyword/karma-reporter
		reporters: ['progress', 'summary'],
		summaryReporter: {
			// 'failed', 'skipped' or 'all'
			show: 'failed',
			// Limit the spec label to this length
			specLength: 50,
			overviewColumn: true
		},

		// web server port
		port: 9876,


		// enable / disable colors in the output (reporters and logs)
		colors: true,


		// level of logging
		// possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
		logLevel: config.LOG_INFO,


		// enable / disable watching file and executing tests whenever any file changes
		autoWatch: false,


		// start these browsers
		// available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
		browsers: ['Chrome'],

		// browserDisconnectTolerance: 100,
		// Continuous Integration mode
		// if true, Karma captures browsers, runs the tests and exits
		singleRun: true,

		// Concurrency level
		// how many browser should be started simultaneous
		concurrency: Infinity
	});
};
