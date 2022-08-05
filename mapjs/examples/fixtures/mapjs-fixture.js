/*global require, module, __dirname, window */
const path = require('path'),
	templateDir = path.join(__dirname, '..', 'assets'),
	defaultTheme = require('../../src/core/theme/default-theme'),
	mergeThemes = require('../../src/core/theme/merge-themes'),
	indexFile = path.resolve(templateDir, 'index.html');
module.exports = function mapjsFixture(mapJson, themeJson, labels) {
	'use strict';
	const baseTheme = themeJson ? mergeThemes(defaultTheme, themeJson) : defaultTheme;
	baseTheme.noAnimations = true;
	return {
		url: `file://${indexFile}`,
		beforeScreenshotArgs: [{
			content: mapJson,
			theme: baseTheme,
			labels: labels
		}],
		beforeScreenshot: function (data) {
			window.postMessage(data, '*');
		}
	};
};
