/*global module*/
const URLHelper = function () {
	'use strict';
	const self = this,
		urlPattern = /(https?:\/\/|www\.)[\w-]+(\.[\w-]+)+([\w\(\)\u0080-\u00FF.,!@?^=%&amp;:\/~+#-]*[\w\(\)\u0080-\u00FF!@?^=%&amp;\/~+#-])?/i,
		hrefUrl = function (url) {
			if (!url) {
				return '';
			}
			if (url[0] === '/') {
				return url;
			}
			if (/^[a-z]+:\/\//i.test(url)) {
				return url;
			}
			return 'http://' + url;
		},
		getGlobalPattern = function () {
			return new RegExp(urlPattern, 'gi');
		};


	self.containsLink = function (text) {
		return urlPattern.test(text);
	};
	self.getLink  = function (text) {
		const url = text && text.match(urlPattern);
		if (url && url[0]) {
			return hrefUrl(url[0]);
		}
		return url;
	};

	self.stripLink  = function (text) {
		if (!text) {
			return '';
		}
		return text.replace(urlPattern, '').trim();
	};
	self.formatLinks = function (text) {
		if (!text) {
			return '';
		}
		return text.replace(self.getPattern(), url => `<a target="_blank" href="${hrefUrl(url)}">${url}</a>`);
	};
	self.getPattern = getGlobalPattern;
	self.hrefUrl = hrefUrl;
};

module.exports = new URLHelper();
