/*global module, require */
const cleanDOMId = require('./clean-dom-id');
module.exports = function linkKey(linkObj) {
	'use strict';
	return cleanDOMId('link_' + linkObj.ideaIdFrom + '_' + linkObj.ideaIdTo);
};
