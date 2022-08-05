/*global require */
const jQuery = require('jquery');
jQuery.fn.innerText = function () {
	'use strict';
	const htmlContent = this.html(),
		containsBr = /<br\/?>/.test(htmlContent),
		containsDiv = /<div>/.test(htmlContent);
	if (containsDiv && this[0].innerText) { /* broken safari jquery text */
		return this[0].innerText.trim();
	} else if (containsBr) { /*broken firefox innerText */
		return htmlContent.replace(/<br\/?>/gi, '\n').replace(/(<([^>]+)>)/gi, '');
	}
	return this.text();
};

