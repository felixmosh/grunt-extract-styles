/*
 * grunt-extract-styles
 *
 * Copyright (c) 2015 Felix
 * Licensed under the MIT license.
 */

'use strict';
var postcss = require('postcss');
var path = require('path');

function getMatches(fileContent, options, sourceDir, destDir) {
	var destFilePaths = [];
	sourceDir = (sourceDir !== '') ? path.normalize(sourceDir) : '';

	if (options.identifierPattern instanceof RegExp) {
		var matches;
		while (matches = options.identifierPattern.exec(fileContent)) {
			var hrefLink = matches[1];
			var sourceFilePath = path.normalize(hrefLink).split('?__extractStyles')[0];
			var destFile = matches[2];
			var extactedFilePath = sourceFilePath;
			extactedFilePath = (extactedFilePath.indexOf('/') > -1) ? path.dirname(extactedFilePath) + '/' : '';
			extactedFilePath += destFile;

			var originalLink = matches[0];
			var replaceOrgLink = originalLink.replace(hrefLink, sourceFilePath);
			var replaceExtractedLink = originalLink.replace(hrefLink, extactedFilePath);

			destFilePaths.push({
				originalLink: originalLink,
				replaceLinks: [
					replaceOrgLink,
					replaceExtractedLink
				],
				sourceFile: sourceDir + sourceFilePath,
				destFiles: {
					source: destDir + sourceFilePath,
					extracted: destDir + extactedFilePath.split('?')[0]
				}
			});
		}
	}

	return destFilePaths;
}

function handleDeclaration(decl, newRule, options) {
	if (options.pattern.test(decl.toString())) {
		var newDecl = decl.clone();
		newDecl.before = decl.before;
		newRule.append(newDecl);

		if (options.remove) {
			decl.removeSelf();
		}
	}
}

function parseCss(css, options, newCSS) {
	if (options.pattern) {
		var atRules = {};

		css.eachRule(function (rule) {
			var newRule = rule.clone();

			newRule.eachDecl(function (decl) {
				decl.removeSelf();
			});

			if (rule.parent.type === 'root') {
				rule.eachDecl(function (decl) {
					handleDeclaration(decl, newRule, options);
				});


				if (newRule.decls.length) {
					newCSS.append(newRule);
				}

			} else if (rule.parent.name === 'media') {
				var newAtRule = rule.parent.clone();
				newAtRule.eachRule(function (childRule) {
					childRule.removeSelf();
				});

				var atRuleKey = newAtRule.params + '';
				if (!atRules.hasOwnProperty(atRuleKey)) {
					atRules[atRuleKey] = newAtRule;
				} else {
					newAtRule = atRules[atRuleKey];
				}

				rule.eachDecl(function (decl) {
					handleDeclaration(decl, newRule, options);
				});

				if (newRule.decls.length) {
					newAtRule.append(newRule);
				}
			}

			if (rule.decls.length === 0) {
				rule.removeSelf();
			}

			if (rule.parent.rules.length === 0) {
				rule.parent.removeSelf();
			}
		});

		for (var key in atRules) {
			if (atRules.hasOwnProperty(key)) {
				newCSS.append(atRules[key]);
			}
		}
	}
}

function extractStyles(sourceFile, destFiles, options, grunt) {
	var newCSS = postcss.root();

	// Our postCSS processor
	var processor = postcss(function (css) {
		parseCss(css, options, newCSS);
	});

	// Read file source.
	var css = grunt.file.read(sourceFile),
		processOptions = {},
		output;

	processOptions.from = sourceFile;
	processOptions.to = destFiles.extracted;

	if (typeof options.preProcess === 'function') {
		css = options.preProcess(css);
	}

	// Run the postprocessor
	output = processor.process(css, processOptions);

	if (typeof options.postProcess === 'function') {
		newCSS = options.postProcess(newCSS.toString());
		output.css = options.postProcess(output.css);
	}

	// Write the newly split file.
	grunt.file.write(destFiles.extracted, newCSS);
	grunt.log.write('File "' + destFiles.source + '" was created. - ');
	grunt.log.ok();

	// Write the destination file
	grunt.file.write(destFiles.source, output.css);
	grunt.log.write('File "' + destFiles.source + '" was created. - ');
	grunt.log.ok();
}

module.exports = function (grunt) {
	grunt.registerMultiTask('extractStyles', 'Extract styles from css based on decelerations matching.', function () {
		// Merge task-specific and/or target-specific options with these defaults.
		var options = this.options({
			pattern: false, // Pattern to match css declaration
			remove: true, // Should we strip the matched rules from the src style sheet?
			preProcess: false,
			postProcess: false,
			identifierPattern: /<link.*href="(.*\?__extractStyles=([^"]+))".*>/g // Pattern to match the css src from Html tag, should match extracted file path
		});

		var isExpanded;

		if (!options.pattern) {
			grunt.fail.fatal('Declaration pattern not found, add Regex pattern in your extractStyles task options.');
			return;
		}

		// Iterate over all specified file groups.
		this.files.forEach(function (file) {
			file.src.forEach(function (filepath) {
				grunt.log.writeln('Processing ' + filepath + '...');

				var destDir = file.orig.dest;
				var baseDir = (file.orig.expand) ? file.orig.cwd : '';
				var htmlFileContent = grunt.file.read(filepath);
				var matches = getMatches(htmlFileContent, options, baseDir, destDir);

				matches.forEach(function (match) {
					if (!grunt.file.exists(match.sourceFile)) {
						grunt.fail.warn('Source file "' + match.sourceFile + '" not found.');
					} else {
						extractStyles(match.sourceFile, match.destFiles, options, grunt);

						htmlFileContent = htmlFileContent.replace(match.originalLink, match.replaceLinks.join('\n\t'));

						if (file.orig.expand) {
							filepath = filepath.replace(baseDir, '');
						}

						grunt.file.write(destDir + filepath, htmlFileContent);

						grunt.log.write('Extracted styles from ' + match.sourceFile + '... - ');
						grunt.log.ok();
					}
				});
			});
		});
	});
};
