/*global require*/
const jQuery = require('jquery'),
	nodeKey = require('../core/util/node-key');

jQuery.fn.nodeWithId = function (id) {
	'use strict';
	return this.find('#' + nodeKey(id));
};

