/*global require, module */
const mapjsFixture = require('./mapjs-fixture'),
	getTheme = function (titleProps) {
		'use strict';
		if (!titleProps.textTheme) {
			return false;
		}
		return {
			node: [{
				name: 'default',
				text: titleProps.textTheme
			}]
		};
	},
	buildMap = function (titleProps) {
		'use strict';
		return {
			formatVersion: 3,
			id: 'root',
			ideas: {
				1: {
					title: titleProps.title,
					id: 1,
					attr: {
						style: titleProps.style
					}
				}
			}
		};
	},
	getLabels = function (titleProps) {
		'use strict';
		return {1: titleProps.label};
	};

module.exports = function (titleProps) {
	'use strict';
	return mapjsFixture(buildMap(titleProps), getTheme(titleProps), getLabels(titleProps));
};

