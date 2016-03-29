/*global module*/
/*
Installing Grunt and associated contributions

- once only per machine
install node and npm:
	http://nodejs.org/download/
install grunt cli:
	npm install -g grunt-cli

- per project

npm install

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
		jscs: {
			src: ['src/*.js', 'test/*-spec.js'],
			options: {
				config: '.jscsrc',
				reporter: 'inline'
			}
		},
		jshint: {
			all: ['src/*.js', 'test/*-spec.js'],
			options: {
				jshintrc: true
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
						'test/*-spec.js'
					],
					vendor: [
						'src/mapjs.js',
						'lib/dependencies.js'
					],
					helpers: [
						'test-lib/describe-batch.js',
						'test-lib/jquery-extension-matchers.js'
					]
				}
			}
		},
		concat: {
			dist: {
				files: {
					'dist/mindmup-mapjs.js': ['src/mapjs.js', 'src/observable.js', 'src/url-helper.js', 'src/content.js', 'src/layout.js', 'src/clipboard.js', 'src/hammer-draggable.js', 'src/map-model.js', 'src/map-toolbar-widget.js', 'src/link-edit-widget.js', 'src/image-drop-widget.js', 'src/dom-map-view.js', 'src/dom-map-widget.js', 'src/theme-css-widget.js','src/theme-processor.js', 'src/theme.js']
				}
			}
		},
		uglify: {
			dist: {
				options: {
					sourceMap: true
				},
				files: {
					'dist/mindmup-mapjs.min.js': ['dist/mindmup-mapjs.js'],
					'dist/index.js': ['dist/npm-dependencies.js', 'dist/mindmup-mapjs.js', 'dist/npm-export.js']
				}
			}
		},
		browserify: {
			dependencies: {
				files: {

					'lib/dependencies.js': ['dist/browserify-dependencies.js']
				}
			}
		}
	});
	grunt.registerTask('checkstyle', ['jshint', 'jscs']);
	grunt.registerTask('precommit', ['checkstyle', 'jasmine']);
	grunt.registerTask('dist', ['checkstyle', 'jasmine', 'browserify:dependencies', 'concat:dist', 'uglify:dist']);

	// Load local tasks.
	grunt.loadNpmTasks('grunt-contrib-jasmine');
	grunt.loadNpmTasks('grunt-notify');
	grunt.loadNpmTasks('grunt-contrib-watch');
	grunt.loadNpmTasks('grunt-jscs');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-browserify');
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
