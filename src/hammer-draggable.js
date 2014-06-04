/*global $, Hammer*/
/*jslint newcap:true*/
(function () {
	'use strict';
	$.fn.simpleDraggableContainer = function () {
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
		}).on('mm:start-dragging-shadow', function (event) {
			var target = $(event.relatedTarget),
				clone = function () {
					return target.clone().addClass('drag-shadow').appendTo(target.parent()).offset(target.offset());
				};
			if (!currentDragObject) {
				currentDragObject = clone();
				originalDragObjectPosition = {
					top: currentDragObject.css('top'),
					left: currentDragObject.css('left')
				};
				currentDragObject.on('mm:stop-dragging mm:cancel-dragging', function (e) {
					if (currentDragObject) {
						currentDragObject.remove();
					}

					target.trigger(e);
				}).on('mm:drag', function (e) { target.trigger(e); });
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

	var onDrag = function (e) {
			$(this).trigger(
				$.Event('mm:start-dragging', {
					relatedTarget: this
				})
			);
			e.stopPropagation();
			if (e.gesture) {
				e.gesture.stopPropagation();
			}
		}, onShadowDrag = function (e) {
			$(this).trigger(
				$.Event('mm:start-dragging-shadow', {
					relatedTarget: this
				})
			);
			e.stopPropagation();
			if (e.gesture) {
				e.gesture.stopPropagation();
			}
		};
	$.fn.simpleDraggable = function (options) {
		if (!options || !options.disable) {
			return $(this).on('dragstart', onDrag);
		} else {
			return $(this).off('dragstart', onDrag);
		}
	};
	$.fn.shadowDraggable = function (options) {
		if (!options || !options.disable) {
			return $(this).on('dragstart', onShadowDrag);
		} else {
			return $(this).off('dragstart', onShadowDrag);
		}
	};
})();
