/*global module */
module.exports = function MemoryClipboard() {
	'use strict';
	const self = this,
		clone = function (something) {
			if (!something) {
				return undefined;
			}
			return JSON.parse(JSON.stringify(something));
		};
	let contents;
	self.get = function () {
		return clone(contents);
	};
	self.put = function (c) {
		contents = clone(c);
	};
};
