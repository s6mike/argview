/*global $, Hammer*/
/*jslint newcap:true */
$.fn.draggableContainer = function () {
	'use strict';
	var currentDragObject,
		originalDragObjectPosition,

		drag = function (event) {
			if (currentDragObject && event.gesture) {
				var newpos = {
						top: parseInt(originalDragObjectPosition.top, 10) + event.gesture.deltaY,
						left: parseInt(originalDragObjectPosition.left, 10) + event.gesture.deltaX
					};
				currentDragObject.css(newpos).trigger('mm:drag');
				event.preventDefault();
				if (event.gesture) {
					event.gesture.preventDefault();
				}
			}
		},
		rollback = function () {
			var target = currentDragObject; // allow it to be cleared while animating
			target.animate(originalDragObjectPosition, {
				complete: function () {
					target.trigger('mm:cancel-dragging');
				},
				progress: function () {
					target.trigger('mm:drag');
				}
			});
		};
	return Hammer($(this), {'drag_min_distance': 2}).on('mm:start-dragging', function (event) {
		if (!currentDragObject) {
			currentDragObject = $(event.relatedTarget);
			originalDragObjectPosition = {
				top: currentDragObject.css('top'),
				left: currentDragObject.css('left')
			};
			$(this).on('drag', drag);
		}
	}).on('dragend', function () {
		var evt = $.Event('mm:stop-dragging');
		if (currentDragObject) {
			currentDragObject.trigger(evt);
			$(this).off('drag', drag);
			if (evt.result === false) {
				rollback();
			}
			currentDragObject = undefined;
		}
	}).on('mouseleave', function () {
		if (currentDragObject) {
			$(this).off('drag', drag);
			rollback();
			currentDragObject = undefined;
		}
	}).attr('data-drag-role', 'container');
};
$.fn.draggable = function () {
	'use strict';
	return $(this).on('dragstart', function () {
		$(this).trigger(
			$.Event('mm:start-dragging', {
				relatedTarget: this
			})
		);
	});
};


