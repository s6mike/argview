/*global module, require */
const cleanDOMId = require('./clean-dom-id');
module.exports = function connectorKey(connectorObj) {
	'use strict';
	return cleanDOMId('connector_' + connectorObj.from + '_' + connectorObj.to);
};

