// TODO: Remove or namespace globals, use module.exports

// TODO: switch to lodash and test
const _ = require('underscore'),
	CONTAINER_CLASS = 'container_argmapjs';

// Can pass element or event
window.getContainerID = function (elementOrEvent) {
	'use strict';
	const containers = document.getElementsByClassName(CONTAINER_CLASS);

	switch (containers.length) {
		case 0:
			return false;
		case 1:
			return containers[0].id;
		default: // If more than 1 container, then see if it's an event with a currentTarget
			const currentTarget = elementOrEvent.currentTarget;
			if (currentTarget) { // If elementOrEvent is an event
				// if current target is container then get id, else set the element to the target.
				if (currentTarget.class === CONTAINER_CLASS) {
					return currentTarget.id;
				} else {
					elementOrEvent = elementOrEvent.target; // elementOrEvent is now an element;
				}
			}
			// elementOrEvent is an element:
			return (elementOrEvent.closest) ? elementOrEvent.closest('.' + CONTAINER_CLASS).id : false;
	}
	return false; // Should never be called
};

// May not be compatible with all modern browsers
window.downloadToFile = function (content, filename, contentType) {
	'use strict';
	const file = new Blob([content], { type: contentType }),
		download_anchor = document.createElement('a');

	download_anchor.href = URL.createObjectURL(file);
	download_anchor.download = filename;
	download_anchor.click();

	URL.revokeObjectURL(download_anchor.href);
};

// eslint-disable-next-line strict
window.idea_pp = function (idea, level = -1, key = []) {
	if (idea) {
		const type = idea.attr ? (idea.attr.group ? `${idea.attr.group}` : '') : '',
			rank = key && key !== '' ? ` ${key}: ` : '';
		let indent = level > 0 ? '  '.repeat(level) : '';
		parseInt(key) > 0 ? indent += ' ' : null; // So ranks with minus sign align
		// TODO FIX: when running as script, _.pick causes an issue if underscore.js not available
		console.debug(`${indent}${rank}`, _.pick(idea, 'id', 'title', 'ideas'), `${type}`);
		if (idea.ideas) {
			// eslint-disable-next-line no-use-before-define
			window.ideas_pp(idea.ideas, level, Object.keys(idea.ideas));
		}
	}
	level -= 1;
	return;
};

// eslint-disable-next-line strict
window.ideas_pp = function (ideas, level = -1, keys = []) {
	// Want to start with extra line break, but it doesn't appear where I expect.
	// level == -1 ? console.debug('') : null;
	level += 1;
	if (!ideas) {
		level -= 1;
		return;
	} else if (ideas.id !== undefined) {
		window.idea_pp(ideas, level, keys);
	} else if (ideas.constructor === Array) {
		ideas.forEach(function (idea, n) {
			window.idea_pp(idea, level, keys[n]);
		});
	} else if (ideas.constructor === Object) {
		level -= 1;
		window.ideas_pp(Object.values(ideas), level, Object.keys(ideas));
	}
	level -= 1;
	return;
};

// ideas_pp(idea);

// Commented out since not needed any longer:

// Two different ways of combining two theme files, see which one works best
// order matters in both merge types, better results from having idea.theme as second argument.
// 	Assume that value of second used where there is a clash.
// const mergeObjects = function (theme1 = themeProvider.default, theme2 = idea.theme, method = "lodash") {
//   switch (method) {

//     case "lodash":
//       const deep_merge = require('lodash/merge');
//       var merged_theme = deep_merge(theme1, theme2);
//       break;

//     default:
//       // QUESTION: This spread operator (...x) worked before: maybe debugger uses ES6 but webpack doesn't?
//       // var merged_theme = { ...theme1, ...theme1 };
//       var merged_theme = Object.assign({}, theme1, theme2);

//   }
//   return merged_theme
// };
