# grunt-extract-styles
[![Built with Grunt](https://img.shields.io/badge/Built%20with-GruntJS-yellow.svg?style=flat)](http://gruntjs.com/)
[![NPM version](https://img.shields.io/npm/v/grunt-extract-styles.svg?style=flat)](https://www.npmjs.com/package/grunt-extract-styles)
> Extract styles from css file based on decelerations matching.

## Getting Started
This plugin requires Grunt `~0.4.2`

If you haven't used [Grunt](http://gruntjs.com/) before, be sure to check out the [Getting Started](http://gruntjs.com/getting-started) guide, as it explains how to create a [Gruntfile](http://gruntjs.com/sample-gruntfile) as well as install and use Grunt plugins. Once you're familiar with that process, you may install this plugin with this command:

```shell
npm install grunt-extract-styles --save-dev
```

Once the plugin has been installed, it may be enabled inside your Gruntfile with this line of JavaScript:

```js
grunt.loadNpmTasks('grunt-extract-styles');
```

## The "extractStyles" task

### Overview
1. In your project's Gruntfile, add a section named `extractStyles` to the data object passed into `grunt.initConfig()`.
2. In your `HTML` file add to style href url the suffix `?__extractStyles=extracted-style-filename.css`.

### Options

#### options.pattern
Type: `RegExp`

Mandatory parameter, the pattern that matchs the declaration for the extracted styles.

#### options.remove
Type: `Boolean`
Default value: `true`

Whether or not to remove the matching declarations from the original stylesheet.

#### options.preProcess
Type: `function`
Default: `false`

Pre-process function that apply on the matched by `identifierPattern` source file content

#### options.postProcess
Type: `function`
Default: `false`

Post-process function that apply on the output content files (original & extracted)

#### options.remainSuffix
Type: `string`
Default: `_remain`

The filename suffix of the remaining content.

#### options.linkIdentifier
Type: `string`
Default: `?__extractStyles`

Identifier of the links in the HTML to extract from. This string will convert to the following `Regex`: 
```js
<link.*href="(.*' + linkIdentifier + '=([^"]+))".*>
```

For example if your options are:

```js
{
    options: {
        pattern: /\[\[[^\]]+\]\]/,
    },
    files: [{
        dest: '.tmp/',
        src: '*.html'
    }]
}
```

And you apply it to the following:

```css
@media screen and (min-width: 50em) {
    .rtl .thing {
        width: 100%;
        color: [[ some-param ]];
    }

   .another .thing {
        color: blue;
    }
}
```

This will be extracted:

```css
@media screen and (min-width: 50em) {
    .rtl .thing {
        color: [[ some-param ]];
    }
}
```

### Usage Examples

#### Splitting Wix tpa params into their own stylesheet

#####Gruntfile:
```js 
grunt.initConfig({
  extractStyles: {
			wixStyle: {
				options: {
					pattern: /\[\[[^\]]+\]\]/,
					preProcess: function (css) {
					    // wix tpa params uses {{}}, this breaks the parsers. convert them to [[]].
						var ret = css.replace(/font:;{{([^}]+)}};/g, 'font: [[$1]];');
						ret = ret.replace(/{{([^}]+)}}/g, '[[$1]]');
						return ret;
					},
					postProcess: function (css) {
					    // wix tpa params uses {{}}, convert back the [[]] to {{}}.
						var ret = css.replace(/font: \[\[([^\]]+)\]\];/g, '{{$1}};');
						ret = ret.replace(/\[\[([^\]}]+)\]\]/g, '{{$1}}');
						return ret;
					}
				},
				src: '*.html',
				dest: '.tmp/'
			}
		}
});
```
#####index.html
```html
<!DOCTYPE html>
<html>
<head lang="en">
	<meta charset="UTF-8">
	<title>Demo</title>
	<link href="style.css?__extractStyles=wix-styles.css?__inline=true" rel="stylesheet" />
</head>
<body></body>
</html>
```

#####style.css
```css
.tpa-first:hover {
	color: {{tpa-color-1}};
	margin-left: 10px;
}
.tpa-second {
	border: 1px solid #000;
	font:;{{Body-M}}; //special case of wix tpa params
}
.no-tpa {
	border: 1px solid #000;
}
.only-tpa {
	color: {{tpa-color-2}};
}

@media (min-width: 300px) and (max-width: 730px) {
	.tpa-first:hover {
		color: {{tpa-color-1}};
		margin-left: 10px;
		padding: 5px 2px 5px 2px;
	}
	.tpa-second {
		border: 1px solid #000;
		font:;{{Body-M}};
	}
	.no-tpa {
		border: 1px solid #000;
	}
	.only-tpa {
		color: {{tpa-color-2}};
	}
}
.in-the-middle {
	width: 100%;
}
@media (min-width: 300px) and (max-width: 730px) {
	.tpa-first:hover {
		width: {{ tpa-width }};
	}
}
```

Will generate in .tmp folder to following files:
#####.tmp/index.html
```html
<!DOCTYPE html>
<html>
<head lang="en">
	<meta charset="UTF-8">
	<title>Demo</title>
	<link href="style_remain.css" rel="stylesheet" />
	<link href="wix-style.css?__inline=true" rel="stylesheet" />
</head>
<body></body>
</html>
```
#####.tmp/style.css
```css
.tpa-first:hover {
	margin-left: 10px;
}
.tpa-second {
	border: 1px solid #000;
}
.no-tpa {
	border: 1px solid #000;
}

@media (min-width: 300px) and (max-width: 730px) {
	.tpa-first:hover {
		margin-left: 10px;
		padding: 5px 2px 5px 2px;
	}
	.tpa-second {
		border: 1px solid #000;
	}
	.no-tpa {
		border: 1px solid #000;
	}
}
.in-the-middle {
	width: 100%;
}
```
#####.tmp/wix-styles.css
```css
.tpa-first:hover {
	color: {{tpa-color-1}};
}
.tpa-second {
	{{Body-M}};
}
.only-tpa {
	color: {{tpa-color-2}};
}

@media (min-width: 300px) and (max-width: 730px) {
	.tpa-first:hover {
		color: {{tpa-color-1}};
	}
	.tpa-second {
		{{Body-M}};
	}
	.only-tpa {
		color: {{tpa-color-2}};
	}
	.tpa-first:hover {
		width: {{ tpa-width }};
	}
}
```
>Note: By default, the matching rules are removed from `style.css` (set by `remove` property).

## Credit

Uses the excellent [PostCSS](https://github.com/ai/postcss) for the actual CSS post-processing.

## Contributing
In lieu of a formal styleguide, take care to maintain the existing coding style. Add unit tests for any new or changed functionality. Lint and test your code using [Grunt](http://gruntjs.com/).