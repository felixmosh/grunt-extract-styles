/*
 * grunt-extract-styles
 * 
 *
 * Copyright (c) 2014 Felix
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

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
			tests: ['tmp']
		},

		// Configuration to be run (and then tested).
		extractStyles: {
			default_task: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					preProcess: function (css) {
						var ret = css.replace(/font:;{{([^}]+)}};/g, 'font: [[$1]];');
						ret = ret.replace(/{{([^}]+)}}/g, '[[$1]]');
						return ret;
					},
					postProcess: function (css) {
						var ret = css.replace(/font: \[\[([^\]]+)\]\];/g, '{{$1}};');
						ret = ret.replace(/\[\[([^\]}]+)\]\]/g, '{{$1}}');
						return ret;
					}
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: '*.html',
				dest: '.tmp/default_task/'
			},
			without_remove: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					remove: false,
					preProcess: function (css) {
						var ret = css.replace(/font:;{{([^}]+)}};/g, 'font: [[$1]];');
						ret = ret.replace(/{{([^}]+)}}/g, '[[$1]]');
						return ret;
					},
					postProcess: function (css) {
						var ret = css.replace(/font: \[\[([^\]]+)\]\];/g, '{{$1}};');
						ret = ret.replace(/\[\[([^\]}]+)\]\]/g, '{{$1}}');
						return ret;
					}
				},
				expand: true,
				cwd: 'test/fixtures/',
				src: '*.html',
				dest: '.tmp/without_remove/'
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

	// Whenever the "test" task is run, first clean the "tmp" dir, then run this
	// plugin's task(s), then test the result.
	grunt.registerTask('test', ['clean', 'extractStyles', 'nodeunit']);

	// By default, lint and run all tests.
	grunt.registerTask('default', ['jshint', 'test']);

};
