/*global require*/
const $ = require('jquery'),
	Hammer = require('exports-loader?Hammer!jquery-hammerjs/jquery.hammer-full.js'),
	onDrag = function (e) {
		'use strict';
		$(this).trigger(
			$.Event('mm:start-dragging', {
				relatedTarget: this,
				gesture: e.gesture
			})
		);
		e.stopPropagation();
		e.preventDefault();
		if (e.gesture) {
			e.gesture.stopPropagation();
			e.gesture.preventDefault();
		}
	},
	onShadowDrag = function (e) {
		'use strict';
		$(this).trigger(
			$.Event('mm:start-dragging-shadow', {
				relatedTarget: this,
				gesture: e.gesture
			})
		);
		e.stopPropagation();
		e.preventDefault();
		if (e.gesture) {
			e.gesture.stopPropagation();
			e.gesture.preventDefault();
		}
	};


$.fn.simpleDraggableContainer = function () {
	'use strict';
	let currentDragObject,
		originalDragObjectPosition;
	const container = this,
		drag = function (event) {

			if (currentDragObject && event.gesture) {
				const newpos = {
					top: Math.round(parseInt(originalDragObjectPosition.top, 10) + event.gesture.deltaY),
					left: Math.round(parseInt(originalDragObjectPosition.left, 10) + event.gesture.deltaX)
				};
				currentDragObject.css(newpos).trigger($.Event('mm:drag', {currentPosition: newpos, gesture: event.gesture}));
				if (event.gesture) {
					event.gesture.preventDefault();
				}
				return false;
			}
		},
		rollback = function (e) {
			const target = currentDragObject; // allow it to be cleared while animating
			if (target.attr('mapjs-drag-role') !== 'shadow') {
				target.animate(originalDragObjectPosition, {
					complete: function () {
						target.trigger($.Event('mm:cancel-dragging', {gesture: e.gesture}));
					},
					progress: function () {
						target.trigger('mm:drag');
					}
				});
			} else {
				target.trigger($.Event('mm:cancel-dragging', {gesture: e.gesture}));
			}
		};
	Hammer(this, {'drag_min_distance': 2}); //eslint-disable-line new-cap
	return this.on('mm:start-dragging', function (event) {
		if (!currentDragObject) {
			currentDragObject = $(event.relatedTarget);
			originalDragObjectPosition = {
				top: currentDragObject.css('top'),
				left: currentDragObject.css('left')
			};
			$(this).on('drag', drag);
		}
	}).on('mm:start-dragging-shadow', function (event) {
		const target = $(event.relatedTarget),
			clone = function () {
				const result = target.clone().addClass('drag-shadow').appendTo(container).offset(target.offset()).data(target.data()).attr('mapjs-drag-role', 'shadow'),
					scale = target.parent().data('scale') || 1;
				if (scale !== 0) {
					result.css({
						'transform': 'scale(' + scale + ')',
						'transform-origin': 'top left'
					});
				}
				return result;
			};
		if (!currentDragObject) {
			currentDragObject = clone();
			originalDragObjectPosition = {
				top: currentDragObject.css('top'),
				left: currentDragObject.css('left')
			};
			currentDragObject.on('mm:stop-dragging mm:cancel-dragging', function (e) {
				this.remove();
				e.stopPropagation();
				e.stopImmediatePropagation();
				const evt = $.Event(e.type, {
					gesture: e.gesture,
					finalPosition: e.finalPosition
				});
				target.trigger(evt);
			}).on('mm:drag', function (e) {
				target.trigger(e);
			});
			$(this).on('drag', drag);
		}
	}).on('dragend', function (e) {
		$(this).off('drag', drag);
		if (currentDragObject) {
			const evt = $.Event('mm:stop-dragging', {
				gesture: e.gesture,
				finalPosition: currentDragObject.offset()
			});
			currentDragObject.trigger(evt);
			if (evt.result === false) {
				rollback(e);
			}
			currentDragObject = undefined;
		}
	}).on('mouseleave', function (e) {
		if (currentDragObject) {
			$(this).off('drag', drag);
			rollback(e);
			currentDragObject = undefined;
		}
	}).attr('data-drag-role', 'container');
};

$.fn.simpleDraggable = function (options) {
	'use strict';
	if (!options || !options.disable) {
		return $(this).on('dragstart', onDrag);
	} else {
		return $(this).off('dragstart', onDrag);
	}
};
$.fn.shadowDraggable = function (options) {
	'use strict';
	if (!options || !options.disable) {
		return $(this).on('dragstart', onShadowDrag);
	} else {
		return $(this).off('dragstart', onShadowDrag);
	}
};
