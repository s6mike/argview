/*global require, module */
const mapjsFixture = require('./mapjs-fixture'),
	buildMap = function (connectorProps) {
		'use strict';
		return {
			formatVersion: 3,
			id: 'root',
			ideas: {
				1: {
					title: 'parent',
					id: 1,
					attr: {
						position: [-185, -182, 1]
					},
					ideas: {
						1: {
							title: 'child',
							id: 2,
							attr: {
								position: [170, 157, 1],
								parentConnector: connectorProps
							}
						}
					}
				}
			}
		};
	};


module.exports = function buildSvgMap(connectorProps) {
	'use strict';
	return mapjsFixture(buildMap(connectorProps));
};
