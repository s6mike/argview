/* global module, require */
const URLHelper = require('../util/url-helper'),
	_ = require('underscore');
module.exports = function formatNoteToHtml(noteText) {
	'use strict';
	if (!noteText) {
		return '';
	}
	if (typeof noteText !== 'string') {
		throw 'invalid-args';
	}
	const safeString = _.escape(noteText);
	return URLHelper.formatLinks(safeString);
};
