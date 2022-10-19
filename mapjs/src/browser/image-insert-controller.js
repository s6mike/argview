/*global module, require, FileReader */
const jQuery = require('jquery'),
	_ = require('underscore'),
	observable = require('../core/util/observable'),
	getDataURIAndDimensions = require('./get-data-uri-and-dimensions');
module.exports = function ImageInsertController(corsProxyUrl, resourceConverter) {
	'use strict';
	const self = observable(this),
		readFileIntoDataUrl = function (fileInfo) {
			const loader = jQuery.Deferred(),
				fReader = new FileReader();
			fReader.onload = function (e) {
				loader.resolve(e.target.result);
			};
			fReader.onerror = loader.reject;
			fReader.onprogress = loader.notify;
			fReader.readAsDataURL(fileInfo);
			return loader.promise();
		};
	self.insertDataUrl = function (dataUrl, evt) {
		self.dispatchEvent('imageLoadStarted');
		getDataURIAndDimensions(dataUrl, corsProxyUrl).then(
			function (result) {
				let storeUrl = result.dataUri;
				if (resourceConverter) {
					storeUrl = resourceConverter(storeUrl);
				}
				self.dispatchEvent('imageInserted', storeUrl, result.width, result.height, evt);
			},
			function (reason) {
				self.dispatchEvent('imageInsertError', reason);
			}
		);
	};
	self.insertFiles = function (files, evt) {
		jQuery.each(files, function (idx, fileInfo) {
			if (/^image\//.test(fileInfo.type)) {
				jQuery.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) {
					self.insertDataUrl(dataUrl, evt);
				});
			}
		});
	};
	self.insertHtmlContent = function (htmlContent, evt) {
		const images = htmlContent.match(/img[^>]*src="([^"]*)"/);
		if (images && images.length > 0) {
			_.each(images.slice(1), function (dataUrl) {
				self.insertDataUrl(dataUrl, evt);
			});
		}
	};
};

