/*global module*/

module.exports = function calcMaxWidth(attr, nodeTheme/*, options*/) {
	'use strict';
	return (attr && attr.style && attr.style.width) || (nodeTheme && nodeTheme.text && nodeTheme.text.maxWidth);
};
