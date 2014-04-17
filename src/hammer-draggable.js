/*global $, Hammer*/
/*jslint newcap:true*/
$.fn.simpleDraggableContainer = function () {
	'use strict';
	var currentDragObject,
		originalDragObjectPosition,
		drag = function (event) {
			if (currentDragObject && event.gesture) {
				var scale = currentDragObject.parent().data('scale') || 1,
					newpos = {
						top: Math.round(parseInt(originalDragObjectPosition.top, 10) + event.gesture.deltaY / scale),
						left: Math.round(parseInt(originalDragObjectPosition.left, 10) + event.gesture.deltaX / scale)
					};
				currentDragObject.css(newpos).trigger($.Event('mm:drag', {gesture: event.gesture}));
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
	}).on('dragend', function (e) {
		var evt = $.Event('mm:stop-dragging', {gesture: e.gesture});
		$(this).off('drag', drag);
		if (currentDragObject) {
			currentDragObject.trigger(evt);
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
$.fn.simpleDraggable = function () {
	'use strict';
	return $(this).on('dragstart', function (e) {
		$(this).trigger(
			$.Event('mm:start-dragging', {
				relatedTarget: this
			})
		);
		e.stopPropagation();
		if (e.gesture) {
			e.gesture.stopPropagation();
		}
	});
};


