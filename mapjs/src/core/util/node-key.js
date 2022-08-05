/*global module, require*/
const cleanDOMId = require('./clean-dom-id');
module.exports = function (id) {
	'use strict';
	return cleanDOMId('node_' + id);
};
