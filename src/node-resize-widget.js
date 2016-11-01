/*global jQuery*/
jQuery.fn.nodeResizeWidget = function (nodeId, mapModel, stagePositionForPointEvent) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			nodeTextElement = element.find('span'),
			nodeTextDOM = nodeTextElement[0],
			initialPosition,
			initialWidth,
			minAllowedWidth = 50,
			initialStyle,
			calcDragWidth = function (evt) {
				var pos = stagePositionForPointEvent(evt),
					dx = pos && initialPosition && (pos.x - initialPosition.x),
					dragWidth = dx && Math.max(minAllowedWidth, (initialWidth + dx));
				return dragWidth;
			},
			dragHandle = jQuery('<div>').addClass('resize-node').shadowDraggable().on('mm:start-dragging mm:start-dragging-shadow', function (evt) {
				mapModel.selectNode(nodeId);
				initialPosition = stagePositionForPointEvent(evt);
				initialWidth = nodeTextElement.innerWidth();
				initialStyle = {
					'node.min-width': element.css('min-width'),
					'span.min-width': nodeTextElement.css('min-width'),
					'span.max-width': nodeTextElement.css('max-width')
				};
			}).on('mm:stop-dragging mm:cancel-dragging', function (evt) {
				var dragWidth = nodeTextElement.outerWidth();
				nodeTextElement.css({'max-width': initialStyle['span.max-width'], 'min-width': initialStyle['span.min-width']});
				element.css('min-width', initialStyle['node.min-width']);
				if (evt) {
					evt.stopPropagation();
				}
				if (evt && evt.gesture) {
					evt.gesture.stopPropagation();
				}
				element.trigger(jQuery.Event('mm:resize', {nodeWidth: dragWidth}));
			}).on('mm:drag', function (evt) {
				var dragWidth = calcDragWidth(evt);
				if (dragWidth) {
					nodeTextElement.css({'max-width': dragWidth, 'min-width': dragWidth});
					element.css('min-width', nodeTextElement.outerWidth());
					if (nodeTextDOM.scrollWidth > nodeTextDOM.offsetWidth) {
						dragWidth = nodeTextDOM.scrollWidth;
						nodeTextElement.css({'max-width': dragWidth, 'min-width': dragWidth});
						element.css('min-width', nodeTextElement.outerWidth());
					}
				}
				if (evt) {
					evt.stopPropagation();
				}
				if (evt && evt.gesture) {
					evt.gesture.stopPropagation();
				}
			});
		dragHandle.appendTo(element);
	});
};
