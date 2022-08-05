/*global module, require*/
const urlHelper = require('../util/url-helper'),
	removeLinks = function (nodeTitle, maxUrlLength) {
		'use strict';
		const strippedTitle = nodeTitle && urlHelper.stripLink(nodeTitle);
		if (strippedTitle.trim() === '') {
			return (!maxUrlLength || (nodeTitle.length < maxUrlLength) ? nodeTitle : (nodeTitle.substring(0, maxUrlLength) + '...'));
		}  else {
			return strippedTitle;
		}
	},
	removeExtraSpaces = function (nodeTitle) {
		'use strict';
		return nodeTitle.replace(/[ \t]+/g, ' ');
	},
	cleanNonPrintable = function (nodeTitle) {
		'use strict';
		return nodeTitle.replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F\u0080-\u009F]+/gu, '');
	},
	trimLines = function (nodeTitle) {
		'use strict';
		return nodeTitle.replace(/\r/g, '').split('\n').map(line => line.trim()).join('\n');
	};
module.exports = function (nodeTitle, maxUrlLength) {
	'use strict';
	if (!nodeTitle || !nodeTitle.trim()) {
		return '';
	}
	const sanitizedTitle = cleanNonPrintable(nodeTitle),
		withoutLinks = removeLinks(sanitizedTitle, maxUrlLength),
		withConsolidatedSpaces = removeExtraSpaces(withoutLinks);
	return trimLines(withConsolidatedSpaces);
};

