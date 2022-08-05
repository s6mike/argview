/*global require, module  */
const mapjsFixture = require('./mapjs-fixture'),
	buildMap = function (linkProps) {
		'use strict';
		return {
			'formatVersion': 3,
			'id': 'root',
			'ideas': {
				'1': {
					'title': 'from',
					'id': 1,
					'attr': {
						'position': [
							-282,
							-75,
							1
						]
					}
				},
				'2': {
					'title': 'to',
					'id': 2,
					'attr': {
						'position': [
							-29,
							0,
							1
						]
					}
				}
			},
			'title': '',
			'links': [
				{
					'ideaIdFrom': 1,
					'ideaIdTo': 2,
					'attr': {
						'style': linkProps
					}
				}
			]
		};
	};

module.exports = function (linkProps) {
	'use strict';
	return mapjsFixture(buildMap(linkProps));
};
