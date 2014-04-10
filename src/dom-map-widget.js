/*jslint nomen: true, newcap: true, browser: true*/
/*global MAPJS, $, Hammer, _*/
MAPJS.DOMRender = {
	config: {
		padding: 8,
		textMaxWidth: 160,
		textClass: 'mapjs-text'
	},
	dimensionProvider: function (idea) {
		'use strict';
		var textBox = $('<div>').addClass('mapjs-node invisible').appendTo('body').updateNodeContent(idea),
			result = {
				width: textBox.outerWidth(true),
				height: textBox.outerHeight(true)
			};
		textBox.detach();
		return result;
	},
	layoutCalculator: function (contentAggregate) {
		'use strict';
		return MAPJS.calculateLayout(contentAggregate, MAPJS.DOMRender.dimensionProvider);
	}
};

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

MAPJS.domMediator = function (mapModel, stageElement) {
	'use strict';

	var connectorKey = function (connectorObj) {
			return 'connector_' + connectorObj.from + '_' + connectorObj.to;
		},
		linkKey = function (linkObj) {
			return 'link_' + linkObj.ideaIdFrom + '_' + linkObj.ideaIdTo;
		},
		nodeKey = function (id) {
			return 'node_' + id;
		},
		scale = function (scaleMultiplier /*, zoomPoint */) {
			var currentScale = stageElement.data('stageScale'),
				targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2),
				scrollParent = stageElement.parent(),
				stageX = stageElement.data('stageX'),
				stageY = stageElement.data('stageY');
			if (currentScale === targetScale) {
				return;
			}
			stageElement.data('stageScale', targetScale);
			stageElement.css('transform', 'translate(-' + stageX + 'px, -' + stageY + 'px) scale(' + targetScale + ') translate(' + stageX + 'px, ' + stageY + 'px)');
			scrollParent.scrollLeft(stageX * (targetScale - currentScale) + scrollParent.scrollLeft());
			scrollParent.scrollTop(stageY * (targetScale - currentScale) + scrollParent.scrollTop());
		},
		updateScreenCoordinates = function () {
			var element = $(this);
			element.css({
				'left': element.data('x') + stageElement.data('stageX'),
				'top' : element.data('y') + stageElement.data('stageY')
			}).trigger('mapjs:move');
		},
		growStage = function (growx, growy) {
			stageElement.data('stageX', stageElement.data('stageX') + growx);
			stageElement.data('stageY', stageElement.data('stageY') + growy);
			stageElement.children('[data-mapjs-role=node]').each(updateScreenCoordinates);
		},
		positionNode = function () {
			return $(this).each(function () {
				var node = $(this),
					xpos = node.data('x') + stageElement.data('stageX'),
					ypos = node.data('y') + stageElement.data('stageY'),
					growx = 0, growy = 0, minGrow = 100,
					expandx = 0, expandy = 0,

					rightBleed = xpos + node.outerWidth(true) - stageElement.width(),
					bottomBleed = ypos + node.outerHeight(true) - stageElement.height();
				if (xpos < 0) {
					growx = Math.max(-1 * xpos, minGrow);
				}
				if (ypos < 0) {
					growy = Math.max(-1 * ypos, minGrow);
				}
				if (rightBleed > 0) {
					expandx = Math.max(rightBleed, minGrow);
				}
				if (bottomBleed > 0) {
					expandy = Math.max(bottomBleed, minGrow);
				}
				if (growx > 0 || growy > 0) {
					growStage(growx, growy);
				}
				if (growx + rightBleed > 0) {
					stageElement.css('min-width', stageElement.width() + growx + rightBleed);
				}
				if (growy + bottomBleed > 0) {
					stageElement.css('min-height', stageElement.height() + growy + bottomBleed);
				}
				node.each(updateScreenCoordinates);
			});
		};


	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = $('#node_' + ideaId);
		if (isSelected) {
			node.addClass('selected');
			node.focus();
		} else {
			node.removeClass('selected');
		}
	});
	mapModel.addEventListener('nodeTitleChanged', function (node) {
		$('#node_' + node.id).find('.text').text(node.title);
	});
	mapModel.addEventListener('nodeRemoved', function (node) {
		$('#node_' + node.id).remove();
	});
	mapModel.addEventListener('nodeMoved', function (node /*, reason*/) {
		$('#node_' + node.id).data({
			'x': node.x,
			'y': node.y
		}).each(positionNode);
	});
	mapModel.addEventListener('nodeAttrChanged', function (n) {
		$('#' + nodeKey(n.id)).updateNodeContent(n);
	});
	mapModel.addEventListener('connectorCreated', function (connector) {
		var element = MAPJS.createSVG()
			.attr({'id': connectorKey(connector), 'data-mapjs-role': 'connector', 'class': 'mapjs-draw-container', 'data-mapjs-node-from': nodeKey(connector.from), 'data-mapjs-node-to': nodeKey(connector.to)})
			.appendTo(stageElement).updateConnector();
		$('#' + nodeKey(connector.from)).on('mapjs:move', function () { element.updateConnector(); });
		$('#' + nodeKey(connector.to)).on('mapjs:move', function () { element.updateConnector(); });
	});
	mapModel.addEventListener('connectorRemoved', function (connector) {
		$('#' + connectorKey(connector)).remove();
	});
	mapModel.addEventListener('linkCreated', function (l) {
		var attr = _.extend({color: 'red', lineStyle: 'dashed'}, l.attr && l.attr.style),
			link = MAPJS.createSVG()
			.attr({
				'id': linkKey(l),
				'data-mapjs-role': 'link',
				'class': 'mapjs-draw-container',
				'data-mapjs-node-from': nodeKey(l.ideaIdFrom),
				'data-mapjs-node-to': nodeKey(l.ideaIdTo),
				'data-mapjs-line-style': attr.lineStyle,
				'data-mapjs-line-color': attr.color,
				'data-mapjs-line-arrow': attr.arrow
			}).appendTo(stageElement).updateLink();
		$('#' + nodeKey(l.ideaIdFrom)).on('mapjs:move', function () { link.updateLink(); });
		$('#' + nodeKey(l.ideaIdTo)).on('mapjs:move', function () { link.updateLink(); });
	});
	mapModel.addEventListener('linkRemoved', function (l) {
		$('#' + linkKey(l)).remove();
	});
	mapModel.addEventListener('linkAttrChanged', function (l) {
		$('#' + linkKey(l)).updateLink();
	});
	mapModel.addEventListener('nodeCreated', function (node) {
		$('<div>')
			.attr('tabindex', 0)
			.attr({ 'id': nodeKey(node.id), 'data-mapjs-role': 'node' })
			.data({ 'x': node.x, 'y': node.y})
			.addClass('mapjs-node')
			.appendTo(stageElement)
			.updateNodeContent(node)
			.on('tap', function (evt) { mapModel.clickNode(node.id, evt); })
			.on('doubletap', function () {
				if (!mapModel.getEditingEnabled()) {
					mapModel.toggleCollapse('mouse');
					return;
				}
				mapModel.editNode('mouse', false, false);
			}).each(positionNode);
	});
	mapModel.addEventListener('mapScaleChanged', scale);

	mapModel.addEventListener('nodeFocusRequested', function (ideaId)  {
		var node = $('#' + nodeKey(ideaId)),
			nodeCenterX = stageElement.data('stageX') + node.data('x') + node.outerWidth(true) / 2,
			nodeCenterY = stageElement.data('stageY') + node.data('y') + node.outerWidth(true) / 2,
			scrollParent = stageElement.parent(),
			newLeftScroll = nodeCenterX - scrollParent.innerWidth() / 2,
			newTopScroll = nodeCenterY - scrollParent.innerHeight() / 2,
			growX = Math.max(-1 * newLeftScroll, 0),
			growY = Math.max(-1 * newTopScroll, 0);
		scale(1);
		if (growX > 0 || growY > 0) {
			growStage(growX, growY);
		}
		if (stageElement.width() - scrollParent.innerWidth() < newLeftScroll - growX) {
			stageElement.css('min-width', scrollParent.innerWidth() + newLeftScroll - growX);
		}
		if (stageElement.height() - scrollParent.innerHeight() < newTopScroll - growY) {
			stageElement.css('min-height', scrollParent.innerHeight() + newTopScroll - growY);
		}
		scrollParent.scrollLeft(newLeftScroll - growX);
		scrollParent.scrollTop(newTopScroll - growY);
		node.focus();
	});

};
$.fn.domMapWidget = function (activityLog, mapModel /*, touchEnabled */) {
	'use strict';
	var hotkeyEventHandlers = {
			'return': 'addSiblingIdea',
			'shift+return': 'addSiblingIdeaBefore',
			'del backspace': 'removeSubIdea',
			'tab insert': 'addSubIdea',
			'left': 'selectNodeLeft',
			'up': 'selectNodeUp',
			'right': 'selectNodeRight',
			'shift+right': 'activateNodeRight',
			'shift+left': 'activateNodeLeft',
			'shift+up': 'activateNodeUp',
			'shift+down': 'activateNodeDown',
			'down': 'selectNodeDown',
			'space f2': 'editNode',
			'f': 'toggleCollapse',
			'c meta+x ctrl+x': 'cut',
			'p meta+v ctrl+v': 'paste',
			'y meta+c ctrl+c': 'copy',
			'u meta+z ctrl+z': 'undo',
			'shift+tab': 'insertIntermediate',
			'Esc 0 meta+0 ctrl+0': 'resetView',
			'r meta+shift+z ctrl+shift+z meta+y ctrl+y': 'redo',
			'meta+plus ctrl+plus z': 'scaleUp',
			'meta+minus ctrl+minus shift+z': 'scaleDown',
			'meta+up ctrl+up': 'moveUp',
			'meta+down ctrl+down': 'moveDown',
			'ctrl+shift+v meta+shift+v': 'pasteStyle',
			'Esc': 'cancelCurrentAction'
		},
		charEventHandlers = {
			'[' : 'activateChildren',
			'{'	: 'activateNodeAndChildren',
			'='	: 'activateSiblingNodes',
			'.'	: 'activateSelectedNode',
			'/' : 'toggleCollapse',
			'a' : 'openAttachment',
			'i' : 'editIcon'
		},
		actOnKeys = true;
	mapModel.addEventListener('inputEnabledChanged', function (canInput) {
		actOnKeys = canInput;
	});


	return this.each(function () {
		var element = $(this),
			stage = $('<div>').css({
				width: '100%',
				height: '100%',
				position: 'relative',
				'min-width': element.innerWidth(),
				'min-height': element.innerHeight()
			}).attr('data-mapjs-role', 'stage').appendTo(element).data({
				'stageX': element.innerWidth() / 2,
				'stageY': element.innerHeight() / 2,
				'stageScale': 1
			});
		element.draggableContainer();
		MAPJS.domMediator(mapModel, stage);
		_.each(hotkeyEventHandlers, function (mappedFunction, keysPressed) {
			element.keydown(keysPressed, function (event) {
				if (actOnKeys) {
					event.preventDefault();
					mapModel[mappedFunction]('keyboard');
				}
			});
		});
		element.on('keypress', function (evt) {
			if (!actOnKeys) {
				return;
			}
			if (/INPUT|TEXTAREA/.test(evt && evt.target && evt.target.tagName)) {
				return;
			}
			var unicode = evt.charCode || evt.keyCode,
				actualkey = String.fromCharCode(unicode),
				mappedFunction = charEventHandlers[actualkey];
			if (mappedFunction) {
				evt.preventDefault();
				mapModel[mappedFunction]('keyboard');
			} else if (Number(actualkey) <= 9 && Number(actualkey) >= 1) {
				evt.preventDefault();
				mapModel.activateLevel('keyboard', Number(actualkey) + 1);
			}
		});
	});
};


// connectors and links should hide if either of the nodes isn't present any more... and not die
// connectors and links should just return on update if they would repaint the same thing - check for parent positions
//
// + shadows
// + selected
// + default and non default backgrounds for root and children
// + multi-line text
// + if adding a node to left/top coordinate beyond 0, expand the stage and move all nodes down, expand by a margin to avoid re-expanding all the time
// + images in background or as separate elements?
// + icon position
// + focus or selected?
// + folded
// + dblclick-tap to collapse/uncollapse
// + hyperlinks
// + custom connectors
// + links and connectors to observe move and drag on nodes and repaint themselves
// + custom connector specs
// + stage resizing (esp node max width)
//
// --------- read only ------------
// - scroll/swipe
// attachment - clip - hook into displaying the attach

// prevent scrolling so the screen is blank
// zoom
// animations
// perf test large maps

//
// --------- editing --------------
// - don't set contentEditable
// - enable drag & drop
// drop
// editing as span or as textarea - grow automatically
// drag background
// straight lines extension
// collaboration avatars
// activated
// mouse events
// mapwidget keyboard bindings
// mapwidget mouse bindings
// html export


// collaboration - collaborator images

// remaining kinetic mediator events
//
// viewing
// +	mapModel.addEventListener('nodeCreated', function (n) {
// +	mapModel.addEventListener('connectorRemoved', function (n) {
// +	mapModel.addEventListener('linkCreated', function (l) {
// +	mapModel.addEventListener('linkRemoved', function (l) {
// +	mapModel.addEventListener('linkAttrChanged', function (l) {
// +	mapModel.addEventListener('nodeMoved', function (n, reason) {
// +	mapModel.addEventListener('nodeRemoved', function (n) {
// +	mapModel.addEventListener('connectorCreated', function (n) {
//		- ensure selected node is visible!
// +	mapModel.addEventListener('nodeFocusRequested', function (ideaId)  {
//		- center!
// +	mapModel.addEventListener('layoutChangeComplete', function () {
// +	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier, zoomPoint) {
// -	mapModel.addEventListener('mapViewResetRequested', function () {
// -	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
// editing
// -	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
// -	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
// +	mapModel.addEventListener('nodeAttrChanged', function (n) {
// -	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
// +	mapModel.addEventListener('nodeTitleChanged', function (n) {
// -	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {

// - node removed
// - node moved (esp reason = failed)
// no more memoization on calc connector - not needed
