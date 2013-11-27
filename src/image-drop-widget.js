/*global $, FileReader, Image, MAPJS, _ */
MAPJS.ImageInsertController = function (callback) {
	'use strict';
	var self = this,
		readFileIntoDataUrl = function (fileInfo) {
			var loader = $.Deferred(),
				fReader = new FileReader();
			fReader.onload = function (e) {
				loader.resolve(e.target.result);
			};
			fReader.onerror = loader.reject;
			fReader.onprogress = loader.notify;
			fReader.readAsDataURL(fileInfo);
			return loader.promise();
		},
		domImg;
	self.insertDataUrl = function (dataUrl, evt) {
		domImg = new Image();
		domImg.onload = function () {
			callback(dataUrl, domImg.width, domImg.height, evt);
		};
		domImg.src = dataUrl;
	};
	self.insertFiles = function (files, evt) {
		$.each(files, function (idx, fileInfo) {
			if (/^image\//.test(fileInfo.type)) {
				$.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) { self.insertDataUrl(dataUrl, evt); });
			}
		});
	};
	self.insertHtmlContent = function (htmlContent, evt) {
		var images = htmlContent.match(/img[^>]*src="([^"]*)"/);
		if (images && images.length > 0) {
			_.each(images.slice(1), function (dataUrl) { self.insertDataUrl(dataUrl, evt); });
		}
	};
};
$.fn.imageDropWidget = function (imageInsertController) {
	'use strict';
	this.on('dragenter dragover', function (e) {
		if (e.originalEvent.dataTransfer) {
			return false;
		}
	}).on('drop', function (e) {
		var dataTransfer = e.originalEvent.dataTransfer,
			htmlContent;
		e.stopPropagation();
		e.preventDefault();
		if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
			imageInsertController.insertFiles(dataTransfer.files, e.originalEvent);
		} else if (dataTransfer) {
			htmlContent = dataTransfer.getData('text/html');
			imageInsertController.insertHtmlContent(htmlContent, e.originalEvent);
		}
	});
	return this;
};

