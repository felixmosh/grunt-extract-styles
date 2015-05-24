/*
 * grunt-extract-styles
 * 
 *
 * Copyright (c) 2014 Felix
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {
	var preProccess = function (css) {
		var ret = css.replace(/font:;{{([^}]+)}};/g, 'font: [[$1]];');
		ret = ret.replace(/{{([^}]+)}}/g, '[[$1]]');
		return ret;
	};

	var postProcess = function (css) {
		var ret = css.replace(/font: \[\[([^\]]+)\]\];/g, '{{$1}};');
		ret = ret.replace(/\[\[([^\]}]+)\]\]/g, '{{$1}}');
		return ret;
	};

	// Project configuration.
	grunt.initConfig({
		jshint: {
			all: [
				'Gruntfile.js',
				'tasks/*.js',
				'<%= nodeunit.tests %>',
			],
			options: {
				jshintrc: '.jshintrc'
			}
		},

		// Before generating any new files, remove any previously-created files.
		clean: {
			tests: ['.tmp']
		},

		// Configuration to be run (and then tested).
		extractStyles: {
			default_task: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index.html',
				dest: '.tmp/default_task/'
			},
			without_remove: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					remove: false,
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index.html',
				dest: '.tmp/without_remove/'
			},
			with_remain: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					remainSuffix: '_rest',
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index.html',
				dest: '.tmp/with_remain/'
			},
			with_extracted_suffix: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					extractedSuffix: '?extracted-suffix=true',
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index_without_suffix.html',
				dest: '.tmp/with_extracted_suffix/'
			},
			without_extracted_filename: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					extractedSuffix: '?extracted-suffix=true',
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index_without_extracted_filename.html',
				dest: '.tmp/without_extracted_filename/'
			},
			with_usemin_without_block: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					usemin: true,
					extractedSuffix: '?__inline=true',
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index_without_suffix.html',
				dest: '.tmp/with_usemin_without_block/'
			},
			with_usemin: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					usemin: true,
					extractedSuffix: '?__inline=true',
					preProcess: preProccess,
					postProcess: postProcess
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: 'index_with_usemin.html',
				dest: '.tmp/with_usemin/'
			}
		},
		concat: {},
		cssmin: {},
		usemin: {
			html: '.tmp/with_usemin/index_with_usemin.html'
		},
		useminPrepare: {
			html: 'test/fixtures/index_with_usemin.html',
			options: {
				dest: '.tmp/with_usemin/',
				staging: '.tmp/with_usemin/'
			}
		},
		// Unit tests.
		nodeunit: {
			tests: ['test/*_test.js']
		}

	});

	// Actually load this plugin's task(s).
	grunt.loadTasks('tasks');

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-usemin');

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean', 'useminPrepare', 'extractStyles', 'concat', 'cssmin', 'usemin', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
