/*global require */
const jQuery = require('jquery'),
	_ = require('underscore');
jQuery.fn.setThemeClassList = function (classList) {
	'use strict';
	const domElement = this[0],
		filterClasses = function (classes) {
			return _.filter(classes, function (c) {
				return /^level_.+/.test(c) ||  /^attr_.+/.test(c);
			});
		},
		toRemove = filterClasses(domElement.classList),
		toAdd = classList && classList.length && filterClasses(classList);
	domElement.classList.remove.apply(domElement.classList, toRemove);
	if (toAdd && toAdd.length) {
		domElement.classList.add.apply(domElement.classList, toAdd);
	}
	return this;
};

