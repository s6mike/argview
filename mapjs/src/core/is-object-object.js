/*global module*/
module.exports = function isObjectObject(value) {
	'use strict';
	if (!value) {
		return false;
	}
	const type = typeof value;
	if (type === 'object') {
		return Object.prototype.toString.call(value) === '[object Object]';
	}
	return false;
};
