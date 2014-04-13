/*jslint nomen: true, newcap: true, browser: true*/
/*global MAPJS, $, Hammer, _, jQuery*/
$.fn.queueFadeOut = function (options) {
	'use strict';
	var element = this;
	return element.fadeOut(_.extend({
		complete: function () {
			element.remove();
		}
	}, options));
};
$.fn.queueFadeIn = function (options) {
	'use strict';
	var element = this;
	return element
		.css('opacity', 0)
		.animate(
			{'opacity': 1},
			_.extend({ complete: function () { element.css('opacity', ''); }}, options)
		);
};
$.fn.scrollWhenDragging = function () {
	'use strict';
	Hammer(this);
	return this.each(function () {
		var element = $(this),
			dragOrigin;
		element.on('dragstart', function () {
			dragOrigin = {
				top: element.scrollTop(),
				left: element.scrollLeft()
			};
		}).on('drag', function (e) {
			if (e.gesture && dragOrigin) {
				element.scrollTop(dragOrigin.top - e.gesture.deltaY);
				element.scrollLeft(dragOrigin.left - e.gesture.deltaX);
			}
		}).on('dragend', function () {
			dragOrigin = undefined;
		});
	});
};
$.fn.updateStage = function () {
	'use strict';
	var data = this.data(),
		size = {
			'min-width': data.width - data.offsetX,
			'min-height': data.height - data.offsetY,
			'width': data.width - data.offsetX,
			'height': data.height - data.offsetY,
			'transform-origin': 'top left',
			'transform': 'translate(' + data.offsetX + 'px, ' + data.offsetY + 'px)'
		};
	if (data.scale && data.scale !== 1) {
		size.transform = 'scale(' + data.scale + ') translate(' + data.offsetX + 'px, ' + data.offsetY + 'px)';
	}
	this.css(size);
	return this;
};
MAPJS.DOMRender.viewController = function (mapModel, stageElement) {
	'use strict';
	var viewPort = stageElement.parent(),
		connectorsForAnimation = $(),
		linksForAnimation = $(),
		nodeAnimOptions = { duration: 400, queue: 'nodeQueue', easing: 'linear' };

	var cleanDOMId = function (s) {
			return s.replace(/\./g, '_');
		},
		connectorKey = function (connectorObj) {
			return cleanDOMId('connector_' + connectorObj.from + '_' + connectorObj.to);
		},
		linkKey = function (linkObj) {
			return cleanDOMId('link_' + linkObj.ideaIdFrom + '_' + linkObj.ideaIdTo);
		},
		nodeKey = function (id) {
			return cleanDOMId('node_' + id);
		},
		stageToViewCoordinates = function (x, y) {
			var stage = stageElement.data();
			return {
				x: stage.scale * (x + stage.offsetX) - viewPort.scrollLeft(),
				y: stage.scale * (y + stage.offsetY) - viewPort.scrollTop()
			};
		},
		viewToStageCoordinates = function (x, y) {
			var stage = stageElement.data();
			return {
				x: (viewPort.scrollLeft() + x) / stage.scale - stage.offsetX,
				y: (viewPort.scrollTop() + y) / stage.scale - stage.offsetY
			};
		},
		updateScreenCoordinates = function () {
			var element = $(this);
			element.css({
				'left': element.data('x'),
				'top' : element.data('y'),
			}).trigger('mapjs:move');
		},
		animateToPositionCoordinates = function () {
			var element = $(this);
			element.clearQueue(nodeAnimOptions.queue).animate({
				'left': element.data('x'),
				'top' : element.data('y'),
				'opacity': 1 /* previous animation can be cancelled with clearqueue, so ensure it gets visible */
			}, _.extend({
				complete: function () {
					element.each(updateScreenCoordinates);
				},
			}, nodeAnimOptions)).trigger('mapjs:animatemove');
		},
		ensureSpaceForPoint = function (x, y) {/* in stage coordinates */
			var stage = stageElement.data(),
				dirty = false;
			if (x < -1 * stage.offsetX) {
				stage.width =  stage.width - stage.offsetX - x;
				stage.offsetX = -1 * x;
				dirty = true;
			}
			if (y < -1 * stage.offsetY) {
				stage.height = stage.height - stage.offsetY - y;
				stage.offsetY = -1 * y;
				dirty = true;
			}
			if (x > stage.width - stage.offsetX) {
				stage.width = stage.offsetX + x;
				dirty = true;
			}
			if (y > stage.height - stage.offsetY) {
				stage.height = stage.offsetY + y;
				dirty = true;
			}
			if (dirty) {
				stageElement.updateStage();
			}
		},
		ensureSpaceForNode = function () {
			return $(this).each(function () {
				var node = $(this).data();
				/* sequence of calculations is important because maxX and maxY take into consideration the new offsetX snd offsetY */
				ensureSpaceForPoint(node.x, node.y);
				ensureSpaceForPoint(node.x + node.width, node.y + node.height);
			});
		},
		centerViewOn = function (x, y, animate)/*in the stage coordinate system*/ {
			var stage = stageElement.data(),
				viewPortCenter = {
					x: viewPort.innerWidth() / 2,
					y: viewPort.innerHeight() / 2
				},
				newLeftScroll, newTopScroll;
			ensureSpaceForPoint(x - viewPortCenter.x / stage.scale, y - viewPortCenter.y / stage.scale);
			ensureSpaceForPoint(x + viewPortCenter.x / stage.scale, y + viewPortCenter.y / stage.scale);

			newLeftScroll = stage.scale * (x + stage.offsetX) - viewPortCenter.x;
			newTopScroll = stage.scale * (y + stage.offsetY) - viewPortCenter.y;

			if (animate) {
				viewPort.animate({
					scrollLeft: newLeftScroll,
					scrollTop: newTopScroll
				}, {
					duration: 400
				});
			} else {
				viewPort.scrollLeft(newLeftScroll);
				viewPort.scrollTop(newTopScroll);
			}
		},
		stagePointAtViewportCenter = function () {
			return viewToStageCoordinates(viewPort.innerWidth() / 2, viewPort.innerHeight() / 2);
		},
		ensureNodeVisible = function (domElement) {
			var result = jQuery.Deferred(),
				node = domElement.data(),
				nodeTopLeft = stageToViewCoordinates(node.x, node.y),
				nodeBottomRight = stageToViewCoordinates(node.x + node.width, node.y + node.height),
				animation = {},
				margin = 10;
			if (nodeTopLeft.x < 0) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeTopLeft.x - margin;
			} else if (nodeBottomRight.x > viewPort.innerWidth()) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeBottomRight.x - viewPort.innerWidth() + margin;
			}
			if (nodeTopLeft.y < 0) {
				animation.scrollTop = viewPort.scrollTop() + nodeTopLeft.y - margin;
			} else if (nodeBottomRight.y > viewPort.innerHeight()) {
				animation.scrollTop = viewPort.scrollTop() + nodeBottomRight.y - viewPort.innerHeight() + margin;
			}
			if (_.isEmpty(animation)) {
				result.resolve();
			} else {
				viewPort.animate(animation, {duration: 100, complete: result.resolve});
			}
			return result;
		};
	mapModel.addEventListener('nodeCreated', function (node) {
		var element = $('<div>')
			.attr({ 'tabindex': 0, 'id': nodeKey(node.id), 'data-mapjs-role': 'node' })
			.data({ 'x': node.x, 'y': node.y, 'width': node.width, 'height': node.height})
			.css({display: 'block', position: 'absolute'})
			.addClass('mapjs-node')
			.appendTo(stageElement)
			.queueFadeIn(nodeAnimOptions)
			.updateNodeContent(node)
			.on('tap', function (evt) { mapModel.clickNode(node.id, evt); })
			.on('doubletap', function () {
				if (!mapModel.getEditingEnabled()) {
					mapModel.toggleCollapse('mouse');
					return;
				}
				mapModel.editNode('mouse');
			})
			.on('attachment-click', function () {
				mapModel.openAttachment('mouse', node.id);
			})
			.each(ensureSpaceForNode)
			.each(updateScreenCoordinates);
		element.css('min-width', element.css('width'));
		MAPJS.DOMRender.addNodeCacheMark(element, node);
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = $('#' + nodeKey(ideaId));
		if (isSelected) {
			ensureNodeVisible(node).then(function () {
				node.addClass('selected').focus();
			});
		} else {
			node.removeClass('selected');
		}
	});
	mapModel.addEventListener('nodeRemoved', function (node) {
		$('#' + nodeKey(node.id)).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('nodeMoved', function (node /*, reason*/) {
		var	nodeDom = $('#' + nodeKey(node.id)).data({
				'x': node.x,
				'y': node.y
			}).each(ensureSpaceForNode),
			screenTopLeft = stageToViewCoordinates(node.x, node.y),
			screenBottomRight = stageToViewCoordinates(node.x + node.width, node.y + node.height);
		if (screenBottomRight.x < 0 || screenBottomRight.y < 0 || screenTopLeft.x > viewPort.innerWidth() || screenTopLeft.y > viewPort.innerHeight()) {
			nodeDom.each(updateScreenCoordinates);
		} else {
			nodeDom.each(animateToPositionCoordinates);
		}
	});
	mapModel.addEventListener('nodeTitleChanged nodeAttrChanged', function (n) {
		$('#' + nodeKey(n.id)).updateNodeContent(n);
	});
	mapModel.addEventListener('connectorCreated', function (connector) {
		var element = MAPJS.createSVG()
			.attr({'id': connectorKey(connector), 'data-mapjs-role': 'connector', 'class': 'mapjs-draw-container'})
			.data({'nodeFrom': $('#' + nodeKey(connector.from)), 'nodeTo': $('#' + nodeKey(connector.to))})
			.appendTo(stageElement).queueFadeIn(nodeAnimOptions).updateConnector();
		$('#' + nodeKey(connector.from)).add($('#' + nodeKey(connector.to)))
			.on('mapjs:move', function () { element.updateConnector(); })
			.on('mapjs:animatemove', function () { connectorsForAnimation = connectorsForAnimation.add(element); });
	});
	mapModel.addEventListener('connectorRemoved', function (connector) {
		$('#' + connectorKey(connector)).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('linkCreated', function (l) {
		var attr = _.extend({color: 'red', lineStyle: 'dashed'}, l.attr && l.attr.style, { 'nodeFrom': $('#' + nodeKey(l.ideaIdFrom)), 'nodeTo': $('#' + nodeKey(l.ideaIdTo)) }),
			link = MAPJS.createSVG()
			.attr({
				'id': linkKey(l),
				'data-mapjs-role': 'link',
				'class': 'mapjs-draw-container'
			})
			.data(attr)
			.appendTo(stageElement).queueFadeIn(nodeAnimOptions).updateLink();
		$('#' + nodeKey(l.ideaIdFrom)).add($('#' + nodeKey(l.ideaIdTo)))
			.on('mapjs:move', function () { link.updateLink(); })
			.on('mapjs:animatemove', function () { linksForAnimation = linksForAnimation.add(link); });

	});
	mapModel.addEventListener('linkRemoved', function (l) {
		$('#' + linkKey(l)).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('linkAttrChanged', function (l) {
		var attr = _.extend({color: 'red', lineStyle: 'dashed'}, l.attr && l.attr.style);
		$('#' + linkKey(l)).data(attr).updateLink();
	});

	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier /*, zoomPoint */) {
		var currentScale = stageElement.data('scale'),
			targetScale = Math.max(Math.min(currentScale * scaleMultiplier, 5), 0.2),
			currentCenter = stagePointAtViewportCenter();
		if (currentScale === targetScale) {
			return;
		}
		stageElement.data('scale', targetScale).updateStage();
		centerViewOn(currentCenter.x, currentCenter.y);
	});
	mapModel.addEventListener('nodeFocusRequested', function (ideaId)  {
		var node = $('#' + nodeKey(ideaId)),
			nodeCenterX = node.data('x') + node.outerWidth(true) / 2,
			nodeCenterY = node.data('y') + node.outerWidth(true) / 2;
		stageElement.data('scale', 1).updateStage();
		centerViewOn(nodeCenterX, nodeCenterY, true);
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		stageElement.data('scale', 1).updateStage();
		centerViewOn(0, 0);
	});
	mapModel.addEventListener('layoutChangeComplete', function () {
		var connectorGroupClone = $(), linkGroupClone = $();

		connectorsForAnimation.each(function () {
			if (!$(this).animateConnectorToPosition(nodeAnimOptions, 2)) {
				connectorGroupClone = connectorGroupClone.add(this);
			}
		});
		linksForAnimation.each(function () {
			if (!$(this).animateConnectorToPosition(nodeAnimOptions, 2)) {
				linkGroupClone = linkGroupClone.add(this);
			}
		});
		connectorsForAnimation = $();
		linksForAnimation = $();
		stageElement.animate({'opacity': 1}, _.extend({
			progress: function () { connectorGroupClone.updateConnector(); linkGroupClone.updateLink(); },
		}, nodeAnimOptions));
		stageElement.children().andSelf().dequeue(nodeAnimOptions.queue);
	});


};
$.fn.domMapWidget = function (activityLog, mapModel, touchEnabled) {
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
				position: 'relative'
			}).attr('data-mapjs-role', 'stage').appendTo(element).data({
				'offsetX': element.innerWidth() / 2,
				'offsetY': element.innerHeight() / 2,
				'width': element.innerWidth(),
				'height': element.innerHeight(),
				'scale': 1
			}).updateStage();
		element.css('overflow', 'auto');
		//element.draggableContainer();
		if (!touchEnabled) {
			element.scrollWhenDragging(); //no need to do this for touch, this is native
		}
		MAPJS.DOMRender.viewController(mapModel, stage);
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


// + connectors and links should hide if either of the nodes isn't present any more... and not die
// + connectors and links should just return on update if they would repaint the same thing - check for parent positions
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
// + zoom
// + animations
// + perf test large maps
// + collapsed style
// + scroll/swipe
// + drag background
// + drag root node to move things
// + drag background to move things
// + clip and hyperlink hover/ better images
// + proper node dimension caching
// + attachment - clip - hook into displaying the attach
// optimise connector -> endpoint searches by mapping data to real objects
// --------- read only ------------
// widget tests
//
// --------- editing --------------
// - don't set contentEditable
// - enable drag & drop
// drop
// editing as span or as textarea - grow automatically

// collaboration avatars
// activated
// mouse events
// mapwidget keyboard bindings
// mapwidget mouse bindings
// html export


//- v2 -
// collaboration - collaborator images
// straight lines extension
// prevent scrolling so the screen is blank
//
//
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
