/*global module*/
/*
Installing Grunt and associated contributions

- once only per machine
install node and npm:
	http://nodejs.org/download/
install grunt cli:
	npm install -g grunt-cli

- per project
npm install grunt-contrib-jasmine --save-dev
npm install grunt-notify --save-dev
npm install grunt-contrib-watch --save-dev

*/

module.exports = function (grunt) {
	'use strict';
	grunt.initConfig({
		notify: {
			jasmine: {
				options: {
					title: 'MapJS Jasmine Tests',
					message: 'jasmine test success'
				}
			}
		},
		watch: {
			specs: {
				files: ['test/*-spec.js'],
				tasks: ['jasmine'],
				options: {
					spawn: false
				}
			},
			src: {
				files: ['src/*.js'],
				tasks: ['jasmine', 'notify:jasmine'],
				options: {
					spawn: false
				}

			}
		},
		jasmine: {
			all: {
				src: ['src/*.js'],
				options: {
					template: 'test-lib/grunt.tmpl',
					outfile: 'SpecRunner.html',
					summary: true,
					display: 'short',
					keepRunner: true,
					specs: [
						'test/*-spec.js',
					],
					vendor: [
						'src/mapjs.js',
						grunt.option('external-scripts') || 'http://static.mindmup.com/20131204091534/external.js',
					],
					helpers: [
						'test-lib/describe-batch.js',
						'test-lib/jquery-extension-matchers.js'
					]
				}
			}
		}
	});

	// Load local tasks.
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-notify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.event.on('watch', function (action, filepath, target) {
		grunt.log.writeln(target + ': ' + filepath + ' has ' + action);
		var options = grunt.config(['jasmine', 'all']);
		if (target === 'specs') {
			options.options.specs = [filepath];
		} else {
			options.options.specs = ['test/*-spec.js'];
		}
		grunt.config(['jasmine', 'all'], options);

	});
};
