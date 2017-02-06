/*global beforeEach, jasmine, require */
const _ = require('underscore');
beforeEach(function () {
	'use strict';
	jasmine.addMatchers({
		toHaveBeenCalledOnJQueryObject: function () {
			return {
				compare: function (actual, expected) {
					return {
						pass: actual.calls && actual.calls.mostRecent() && actual.calls.mostRecent().object[0] === expected[0]
					};
				}
			};
		},
		toHaveOwnStyle: function () {
			const checkStyle = function (element, style) {
				if (element.attr('style')) {
					if (_.isArray(style)) {
						return _.find(style, function (aStyle) {
							return checkStyle(element, aStyle);
						});
					} else {
						return element.attr('style').indexOf(style) >= 0;
					}
				}
				return false;
			};
			return {
				compare: function (element, styleName) {
					const result = {
						pass: checkStyle(element, styleName)
					};
					if (result.pass) {
						result.message = element.attr('style') + ' has own style ' + styleName;
					} else {
						result.message = element[0] + ' does not have own style ' + styleName + ' (' + element.attr('style') + ')';
					}
					return result;
				}
			};
		}
	});
});

