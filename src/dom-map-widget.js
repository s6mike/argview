/*global MAPJS, $, _, Hammer*/
/*jslint nomen: true, newcap: true, browser: true*/
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
$.fn.positionNode = function (stageElement) {
	'use strict';
	return $(this).each(function () {
		var node = $(this),
			xpos = node.data('x') + stageElement.data('stage-x'),
			ypos = node.data('y') + stageElement.data('stage-y'),
			growx = 0, growy = 0, minGrow = 100,
		    move = function () {
				var element = $(this),
					oldpos = {
						top: parseInt(element.css('top'), 10),
						left: parseInt(element.css('left'), 10)
					},
					newpos = {
						top: oldpos.top + growy,
						left: oldpos.left + growx
					};
				element.css(newpos);
			};
		if (xpos < 0) {
			growx = Math.max(-1 * xpos, minGrow);
		}
		if (ypos < 0) {
			growy = Math.max(-1 * ypos, minGrow);
		}
		if (growx > 0 || growy > 0) {
			stageElement.children().each(move);
			stageElement.data('stage-x', stageElement.data('stage-x') + growx);
			stageElement.data('stage-y', stageElement.data('stage-y') + growy);
		}
		node.css({
			'left': xpos + growx,
			'top': ypos + growy
		});
	});
};
MAPJS.domMediator = function (mapModel, stageElement) {
	'use strict';

	var connectorKey = function (connectorObj) {
			return 'connector_' + connectorObj.from + '_' + connectorObj.to;
		},
		nodeKey = function (id) {
			return 'node_' + id;
		},
		connectorsFor = function (nodeId) {
			return $('[data-mapjs-node-from=' + nodeKey(nodeId) + ']').add('[data-mapjs-node-to=' + nodeKey(nodeId) + ']');
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
		}).positionNode(stageElement);
		connectorsFor(node.id).updateConnector();
	});
	mapModel.addEventListener('nodeAttrChanged', function (n) {
		$('#' + nodeKey(n.id)).updateNodeContent(n);
	});

	mapModel.addEventListener('connectorCreated', function (connector) {
		MAPJS.createSVG()
			.attr({'id': connectorKey(connector), 'class': 'mapjs-draw-container', 'data-mapjs-node-from': nodeKey(connector.from), 'data-mapjs-node-to': nodeKey(connector.to)})
			.appendTo(stageElement).updateConnector();
	});
	mapModel.addEventListener('connectorRemoved', function (connector) {
		$('#' + connectorKey(connector)).remove();
	});
	mapModel.addEventListener('nodeCreated', function (node) {
		$('<div>')
			.attr('tabindex', 0)
			.attr({ 'id': nodeKey(node.id), 'data-mapjs-role': 'node' })
			.data({ 'x': node.x, 'y': node.y})
			.addClass('mapjs-node')
			.appendTo(stageElement).on('tap', function (evt) { mapModel.clickNode(node.id, evt); })
			.positionNode(stageElement)
			.updateNodeContent(node)
			.on('doubletap', function () {
				if (!mapModel.getEditingEnabled()) {
					mapModel.toggleCollapse('mouse');
					return;
				}
				mapModel.editNode('mouse', false, false);
			});
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
			stage = $('<div>').css({width: '100%', height: '100%', position: 'relative'}).attr('data-mapjs-role', 'stage').appendTo(element);
		element.draggableContainer();
		stage.data('stage-x', element.innerWidth() / 2);
		stage.data('stage-y', element.innerHeight() / 2);
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
//
// --------- read only ------------
// - scroll/swipe
// attachment - clip - hook into displaying the attach
// custom connectors
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
// -	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
// -	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
// +	mapModel.addEventListener('nodeCreated', function (n) {
// -	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
// -	mapModel.addEventListener('nodeFocusRequested', function (ideaId)  {
// +	mapModel.addEventListener('nodeAttrChanged', function (n) {
// -	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
// +	mapModel.addEventListener('nodeRemoved', function (n) {
// +	mapModel.addEventListener('nodeMoved', function (n, reason) {
// +	mapModel.addEventListener('nodeTitleChanged', function (n) {
// +	mapModel.addEventListener('connectorCreated', function (n) {
// -	mapModel.addEventListener('layoutChangeComplete', function () {
// +	mapModel.addEventListener('connectorRemoved', function (n) {
// -	mapModel.addEventListener('linkCreated', function (l) {
// -	mapModel.addEventListener('linkRemoved', function (l) {
// -	mapModel.addEventListener('linkAttrChanged', function (l) {
// -	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier, zoomPoint) {
// -	mapModel.addEventListener('mapViewResetRequested', function () {
// -	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
// -	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {

// - node removed
// - node moved (esp reason = failed)
// no more memoization on calc connector - not needed
