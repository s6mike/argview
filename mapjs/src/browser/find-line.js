/*global require */
const jQuery = require('jquery'),
	connectorKey = require('../core/util/connector-key'),
	linkKey = require('../core/util/link-key');
jQuery.fn.findLine = function (line) {
	'use strict';
	if (line && line.type === 'connector') {
		return this.find('#' + connectorKey(line));
	} else if (line && line.type === 'link') {
		return this.find('#' + linkKey(line));
	}
	console.log('invalid.line', line); //eslint-disable-line
	throw 'invalid-args';
};

