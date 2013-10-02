/*global $, FileReader, Image */
$.fn.imageDropWidget = function (callback) {
	'use strict';
	var readFileIntoDataUrl = function (fileInfo) {
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
		domImg,
		insertFiles = function (files, x, y) {
			$.each(files, function (idx, fileInfo) {
				if (/^image\//.test(fileInfo.type)) {
					$.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) {
						domImg = new Image();
						domImg.onload = function () {
							callback(dataUrl, domImg.width, domImg.height, x, y);
						};
						domImg.src = dataUrl;
					});
				}
			});
		};
	this.on('dragenter dragover', function (e) {
		if (e.originalEvent.dataTransfer) {
			return false;
		}
	}).on('drop', function (e) {
		var dataTransfer = e.originalEvent.dataTransfer;
		e.stopPropagation();
		e.preventDefault();
		if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
			insertFiles(dataTransfer.files, e.originalEvent.x, e.originalEvent.y);
		}
	});
};

