/*global require, module */
const mapjsFixture = require('./mapjs-fixture'),
	buildMap = function () {
		'use strict';
		return {
			formatVersion: 3,
			id: 'root',
			ideas: {
				1: {
					title: 'First level',
					id: 1,
					ideas: {
						2: {
							id: 2,
							title: 'Child 1'
						},
						3: {
							id: 3,
							title: 'Child 2'
						}
					}
				}
			}
		};
	};


module.exports = function buildSvgMap(themeProps, contextOptions) {
	'use strict';
	const theme = {
		name: 'test theme',
		node: [],
		connector: {},
		link: {}
	};
	theme[contextOptions.params['theme-element']][contextOptions.params['theme-element-property']] = themeProps;
	return mapjsFixture(buildMap(), theme);
};

