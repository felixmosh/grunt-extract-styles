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

  var matches;
  while (matches = options.linkPattern.exec(fileContent)) {
    var hrefLink = matches[1];
    var sourceFilePath = path.normalize(hrefLink).split(options.linkIdentifier)[0];
    var extension = path.extname(sourceFilePath);
    var remainFilePath = sourceFilePath.replace(extension, options.remainSuffix + extension);
    var destFile = matches[2] || (path.basename(sourceFilePath).replace(extension, options.extractedFileSuffix + extension));
    var extractedFilePath = sourceFilePath;
    extractedFilePath = (extractedFilePath.indexOf('/') > -1) ? path.dirname(extractedFilePath) + '/' : '';
    extractedFilePath += destFile;

    var originalLink = matches[0];
    var replaceOrgLink = originalLink.replace(hrefLink, remainFilePath);
    var replaceExtractedLink = originalLink.replace(hrefLink, extractedFilePath + options.extractedSuffix);

    destFilePaths.push({
      originalLink: originalLink,
      replaceLinks: [
        replaceOrgLink,
        replaceExtractedLink
      ],
      sourceFile: path.join(sourceDir, sourceFilePath),
      remainFile: remainFilePath,
      destFiles: {
        source: path.join(destDir, sourceFilePath),
        remain: path.join(destDir, remainFilePath),
        extracted: path.join(destDir, extractedFilePath.split('?')[0])
      }
    });
  }

  return destFilePaths;
}

function handleDeclarations(rule, newRule, options) {
  rule.walkDecls(function (decl) {
    if (options.pattern.test(decl.toString())) {
      var newDecl = decl.clone();
      newDecl.raws = decl.raws;
      newRule.append(newDecl);

      if (options.remove) {
        decl.remove();

        if (rule.nodes.length === 0) {
          rule.remove();
        }
      }
    }
  });
}

function cloneRule(rule) {
  var newRule = rule.clone();
  newRule.raws = rule.raws;

  newRule.removeAll();

  return newRule;
}

function cloneAtRole(rule) {
  var newAtRule = rule.clone();
  newAtRule.raws = rule.raws;

  newAtRule.removeAll();

  return newAtRule;
}

function parseCss(css, options, newCSS) {
  css.each(function (rule) {
    if (rule.type === 'atrule' && rule.walkRules) {
      var newAtRule = cloneAtRole(rule);
      parseCss(rule, options, newAtRule);

      if (newAtRule.nodes.length) {
        newCSS.append(newAtRule);
      }
      if (options.remove && !rule.nodes.some(function (rule) {
          return rule.type !== 'comment';
        })) {
        rule.remove();
      }
    }
    else if (rule.type === 'rule' && rule.walkDecls) {
      var newRule = cloneRule(rule);

      handleDeclarations(rule, newRule, options);
      if (newRule.nodes.length) {
        newCSS.append(newRule);
      }

      if (options.remove && !rule.nodes.some(function (decl) {
          return decl.type !== 'comment';
        })) {
        rule.remove();
      }
    }
  });
}

function extractStyles(sourceFile, destFiles, options, grunt) {
  var newCSS = postcss.root();

  // Our postCSS processor
  var processor = postcss(function (css) {
    parseCss(css, options, newCSS);
  });

  // Read file source.
  var css = grunt.file.read(sourceFile);

  if (typeof options.preProcess === 'function') {
    css = options.preProcess(css);
  }

  // Run the postprocessor
  return processor.process(css).then(function (result) {
    var output = result.css;
    newCSS = newCSS.toString();
    if (typeof options.postProcess === 'function') {
      newCSS = options.postProcess(newCSS);
      output = options.postProcess(output);
    }

    // Write the newly split file.
    grunt.file.write(destFiles.extracted, newCSS);
    grunt.log.write('File "' + destFiles.extracted + '" was created. - ');
    grunt.log.ok();

    // Write the destination file
    grunt.file.write(destFiles.remain, output);
    grunt.log.write('File "' + destFiles.remain + '" was created. - ');
    grunt.log.ok();
  });
}

function concatFiles(htmlMatches, match, grunt) {
  var config = grunt.config(['concat', 'generated']);
  var useminDest = grunt.config(['useminPrepare', 'options']).dest;
  var concatFilePath = match.src.pop();
  var minFilePath = match.dest;

  var files = grunt.task.normalizeMultiTaskFiles(config)
    // Only work on the original src/dest, since files.src is a [GETTER]
    .map(function (files) {
      return files.orig;
    }).filter(function (fileItem) {
      return fileItem.dest === concatFilePath;
    });

  files.forEach(function (files) {
    files.src.push(htmlMatches.destFiles.remain);
  });

  var pathDiff = path.relative(useminDest, minFilePath);

  grunt.config(['concat', 'generated'], config); //save back the modified config

  grunt.log.writeln('Added "' + htmlMatches.destFiles.remain.cyan + '" to "<!-- build:css ' + pathDiff.yellow + ' -->" Usemin css block.');

  return true;
}

function concatUseminFiles(endsWith, htmlMatches, fileContent, grunt) {
  var config = grunt.config(['cssmin', 'generated']);
  if (!config) {
    return false;
  }

  // Find cssmin destination(s) matching ext
  var matches = grunt.task.normalizeMultiTaskFiles(config)
    .map(function (files) {
      return files.orig;
    })
    .filter(function (files) {
      return endsWith === files.dest.substr(-endsWith.length);
    });

  // *Something* should've matched
  if (!matches.length) {
    grunt.log.warn('Could not find usemin.generated path matching: ' + endsWith.red);

    return false;
  }

  var match = matches.shift();
  // Finally, modify concat target sourced by matching uglify target
  return concatFiles(htmlMatches, match, grunt);
}

function findUseminCssBlock(fileContent) {
  // Find if there is any css usemin block in the Html
  return fileContent.match(/<!--\s*build:css(?:\([^\)]+\))?\s*([^\s]+)\s*-->/);
}

function handleHTML(fileContent, options, match, grunt) {
  var useminCssBlock = findUseminCssBlock(fileContent);
  if (options.usemin && useminCssBlock) {
    concatUseminFiles(useminCssBlock[1], match, fileContent, grunt);
    var startBlockPos = useminCssBlock.index;
    var useminEndBlock = '<!-- endbuild -->';
    var endBlockPos = fileContent.indexOf(useminEndBlock, startBlockPos);
    if (endBlockPos > -1) {
      var slice = fileContent.substr(startBlockPos, endBlockPos - startBlockPos);
      fileContent = fileContent.replace(slice, slice + match.replaceLinks[0] + '\n\t');
      match.replaceLinks.shift();
    }
    else {
      grunt.log.warn('Could not find "' + useminEndBlock.red + '" block.');
    }
  }

  fileContent = fileContent.replace(match.originalLink, match.replaceLinks.join('\n\t'));

  return fileContent;
}

module.exports = function (grunt) {
  grunt.registerMultiTask('extractStyles', 'Extract styles from css based on decelerations matching.', function () {
    // Merge task-specific and/or target-specific options with these defaults.
    var options = this.options({
      pattern: null, // Pattern to match css declaration
      remove: true, // Should we strip the matched rules from the src style sheet?
      preProcess: null,
      postProcess: null,
      remainSuffix: '.remain', // remaining filename suffix
      extractedFileSuffix: '.extracted', // extracted filename suffix
      extractedSuffix: '', // suffix for the extracted file link
      linkIdentifier: '?__extractStyles', // The identifier of link src
      usemin: false // if true, the remaining link will be added to the last Usemin css block
    });

    if (!options.pattern) {
      grunt.fail.fatal('Declaration pattern not found, add Regex pattern in your extractStyles task options.');
      return;
    }

    options.linkPattern = new RegExp('<link.*href="(.*' + options.linkIdentifier + '(?:=([^"]+))?)".*>', 'g');

    var done = this.async();
    var extractions = [];
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
              var extraction = extractStyles(match.sourceFile, match.destFiles, options, grunt).then(function () {
                htmlFileContent = handleHTML(htmlFileContent, options, match, grunt);

                if (file.orig.expand) {
                  filepath = filepath.replace(baseDir, '');
                }

                grunt.file.write(path.join(destDir, filepath), htmlFileContent);

                grunt.log.write('Extracted styles from ' + match.sourceFile + '. - ');
                grunt.log.ok();
              });

              extractions.push(extraction);
            }
          }
        );
      });
    });

    Promise.all(extractions).then(function() {
      done();
    });
  });
};
