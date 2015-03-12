'use strict';

var grunt = require('grunt');

/*
 ======== A Handy Little Nodeunit Reference ========
 https://github.com/caolan/nodeunit

 Test methods:
 test.expect(numAssertions)
 test.done()
 Test assertions:
 test.ok(value, [message])
 test.equal(actual, expected, [message])
 test.notEqual(actual, expected, [message])
 test.deepEqual(actual, expected, [message])
 test.notDeepEqual(actual, expected, [message])
 test.strictEqual(actual, expected, [message])
 test.notStrictEqual(actual, expected, [message])
 test.throws(block, [error], [message])
 test.doesNotThrow(block, [error], [message])
 test.ifError(value)
 */

exports.split_styles = {
	setUp: function (done) {
		// setup here if necessary
		done();
	},
	default_task: function (test) {
		test.expect(3);

		var actualExtracted = grunt.file.read('.tmp/default_task/style_remain.css').trim();
		var actualRemaining = grunt.file.read('.tmp/default_task/wix-style.css').trim();
		var actualHtml = grunt.file.read('.tmp/default_task/index.html').trim();

		var expectedExtracted = grunt.file.read('test/expected/default_task/style.css').trim();
		var expectedRemaining = grunt.file.read('test/expected/default_task/wix-style.css').trim();
		var expectedHtml = grunt.file.read('test/expected/default_task/index.html').trim();

		test.equal(actualExtracted, expectedExtracted, 'should create a file with only styles wix tpa params.');
		test.equal(actualRemaining, expectedRemaining, 'should remove styles with tpa params.');
		test.equal(actualHtml, expectedHtml, 'should split extracted link into 2 links');


		test.done();
	},
	without_remove: function (test) {
		test.expect(3);

		var actualExtracted = grunt.file.read('.tmp/without_remove/style_remain.css').trim();
		var actualRemaining = grunt.file.read('.tmp/without_remove/wix-style.css').trim();
		var actualHtml = grunt.file.read('.tmp/without_remove/index.html').trim();

		var expectedExtracted = grunt.file.read('test/expected/without_remove/style.css').trim();
		var expectedRemaining = grunt.file.read('test/expected/without_remove/wix-style.css').trim();
		var expectedHtml = grunt.file.read('test/expected/without_remove/index.html').trim();

		test.equal(actualExtracted, expectedExtracted, 'should create a file with only styles wix tpa params.');
		test.equal(actualRemaining, expectedRemaining, 'should not remove styles with tpa params.');
		test.equal(actualHtml, expectedHtml, 'should split extracted link into 2 links');


		test.done();
	},
  with_remain: function (test) {
		test.expect(3);

		var actualExtracted = grunt.file.read('.tmp/with_remain/style_rest.css').trim();
		var actualRemaining = grunt.file.read('.tmp/with_remain/wix-style.css').trim();
		var actualHtml = grunt.file.read('.tmp/with_remain/index.html').trim();

		var expectedExtracted = grunt.file.read('test/expected/with_remain/style.css').trim();
		var expectedRemaining = grunt.file.read('test/expected/with_remain/wix-style.css').trim();
		var expectedHtml = grunt.file.read('test/expected/with_remain/index.html').trim();

		test.equal(actualExtracted, expectedExtracted, 'should create a file with only styles wix tpa params.');
		test.equal(actualRemaining, expectedRemaining, 'should not remove styles with tpa params.');
		test.equal(actualHtml, expectedHtml, 'should split extracted link into 2 links');


		test.done();
	}
};
