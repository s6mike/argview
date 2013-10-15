/*global $, FileReader, Image, MAPJS */
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
	self.insertFiles = function (files, evt) {
		$.each(files, function (idx, fileInfo) {
			if (/^image\//.test(fileInfo.type)) {
				$.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) {
					domImg = new Image();
					domImg.onload = function () {
						callback(dataUrl, domImg.width, domImg.height, evt);
					};
					domImg.src = dataUrl;
				});
			}
		});
	};
};
$.fn.imageDropWidget = function (imageInsertController) {
	'use strict';
	this.on('dragenter dragover', function (e) {
		if (e.originalEvent.dataTransfer) {
			return false;
		}
	}).on('drop', function (e) {
		var dataTransfer = e.originalEvent.dataTransfer;
		e.stopPropagation();
		e.preventDefault();
		if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
			imageInsertController.insertFiles(dataTransfer.files, e.originalEvent);
		}
	});
	return this;
};

