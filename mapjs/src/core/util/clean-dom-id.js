/*global module*/
module.exports = function cleanDOMId(s) {
	'use strict';
	return s.replace(/[^A-Za-z0-9_-]/g, '_');
};
