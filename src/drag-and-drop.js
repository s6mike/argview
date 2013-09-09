/*global _, MAPJS*/
MAPJS.dragdrop = function (mapModel, stage) {
	'use strict';
	var currentDroppable,
		findNodeOnStage = function (nodeId) {
			return stage.get('#node_' + nodeId)[0];
		},
		findConnectorOnStage = function (nodeId) {
			return stage.get('#connector_' + nodeId)[0];
		},
		showAsDroppable = function (nodeId, isDroppable) {
			var node = findNodeOnStage(nodeId);
			node.setIsDroppable(isDroppable);
		},
		updateCurrentDroppable = function (nodeId) {
			if (currentDroppable !== nodeId) {
				if (currentDroppable) {
					showAsDroppable(currentDroppable, false);
				}
				currentDroppable = nodeId;
				if (currentDroppable) {
					showAsDroppable(currentDroppable, true);
				}
			}
		},
		isPointOverNode = function (x, y, node) { //move to mapModel candidate
			/*jslint eqeq: true*/
			return x >= node.x &&
				y >= node.y &&
				x <= node.x + node.width &&
				y <= node.y + node.height;
		},
		canDropOnNode = function (id, x, y, node) {
			/*jslint eqeq: true*/
			return id != node.id && isPointOverNode(x, y, node);
		},
		tryFlip = function (rootNode, nodeBeingDragged, nodeDragEndX) {
			var flipRightToLeft = rootNode.x < nodeBeingDragged.x && nodeDragEndX < rootNode.x,
				flipLeftToRight = rootNode.x > nodeBeingDragged.x && rootNode.x < nodeDragEndX;
			if (flipRightToLeft || flipLeftToRight) {
				return mapModel.getIdea().flip(nodeBeingDragged.id);
			}
			return false;
		},
		distance = function (node1, node2) {
			return Math.min(
				Math.abs(node1.x - node2.x),
				Math.abs(node1.x - node2.x - node2.width),
				Math.abs(node1.x + node1.width - node2.x - node2.width),
				Math.abs(node1.x + node1.width - node2.x)) +
			Math.min(
				Math.abs(node1.y - node2.y),
				Math.abs(node1.y - node2.y - node2.height),
				Math.abs(node1.y + node1.height - node2.y - node2.height),
				Math.abs(node1.y + node1.height - node2.y)
			);
		},
		canSwitchToManualPositioning = function (nodeBeingDragged) {
			var idea = mapModel.getIdea(),
				parentIdea = idea.findParent(nodeBeingDragged.id),
				result = !idea.getAttrById(nodeBeingDragged.id, 'position');
			result = result && _.every(parentIdea.ideas, function (subIdea) {
				if (subIdea.id === nodeBeingDragged.id || subIdea.getAttr('position')) {
					return true;
				}
				return distance(nodeBeingDragged, mapModel.getCurrentLayout().nodes[subIdea.id]) > 50;
			});
			return result;
		},
		nodeDragMove = function (id, x, y, nodeX, nodeY, shouldCopy, shouldPositionAbsolutely) {
			var nodeId,
				node = mapModel.getCurrentLayout().nodes[id],
				isPositioningAbsolute = mapModel.getIdea().getAttrById(id, 'position');
			if (!mapModel.isEditingEnabled()) {
				return;
			}
			var nodeBeingDragged = {
				id: id,
				x: nodeX,
				y: nodeY,
				width: node.width,
				height: node.height
			};
			var connector = findConnectorOnStage(id);
			if (connector) {
				connector.setPositioningAbsolute(isPositioningAbsolute || canSwitchToManualPositioning(nodeBeingDragged));
			}
			for (nodeId in mapModel.getCurrentLayout().nodes) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					updateCurrentDroppable(nodeId);
					return;
				}
			}
			updateCurrentDroppable(undefined);
		},
		nodeDragEnd = function (id, x, y, nodeX, nodeY, shouldCopy, shouldPositionAbsolutely) {
			var nodeBeingDragged = mapModel.getCurrentLayout().nodes[id],
				nodeId,
				node,
				rootNode = mapModel.getCurrentLayout().nodes[mapModel.getIdea().id],
				verticallyClosestNode,
				clone,
				idea = mapModel.getIdea(),
				parentIdea = idea.findParent(id),
				parentNode,
				childrenWithAutoPositioning = {},
				isPositionedManually = !!idea.getAttrById(id, 'position'),
				reorderThreshold = 30;
			var connector = findConnectorOnStage(id);
			if (connector) {
				connector.setPositioningAbsolute(isPositionedManually);
			}
			if (!mapModel.isEditingEnabled()) {
				mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
				return;
			}
			updateCurrentDroppable(undefined);
			mapModel.dispatchEvent('nodeMoved', nodeBeingDragged);
			parentNode = mapModel.getCurrentLayout().nodes[parentIdea.id];
			if (canDropOnNode(id, x, y, parentNode)) {
				if (isPositionedManually) {
					idea.updateAttr(id, 'position');
				} else {
					mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
					mapModel.analytic('nodeDragFailed');
				}
				return;
			}
			_.map(parentIdea.ideas, function (subIdea) {
				if (!subIdea.getAttr('position')) {
					childrenWithAutoPositioning[subIdea.id] = subIdea;
				}
			});
			for (nodeId in mapModel.getCurrentLayout().nodes) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (canDropOnNode(id, x, y, node)) {
					if (shouldCopy) {
						clone = mapModel.getIdea().clone(id);
						if (!clone || !mapModel.getIdea().paste(nodeId, clone)) {
							mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
							mapModel.analytic('nodeDragCloneFailed');
						}
					} else if (!mapModel.getIdea().changeParent(id, nodeId)) {
						mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
						mapModel.analytic('nodeDragParentFailed');
					}
					return;
				}
				if (childrenWithAutoPositioning[node.id]) {
					if (!verticallyClosestNode) {
						verticallyClosestNode = {
							id: null,
							y: Infinity
						};
					}
					if (y < node.y && node.y < verticallyClosestNode.y) {
						verticallyClosestNode = node;
					}
				}
			}
			if (tryFlip(rootNode, nodeBeingDragged, x)) {
				return;
			}
			node = mapModel.getCurrentLayout().nodes[id];
			var realNodeBeingDragged = {
				id: id,
				x: nodeX,
				y: nodeY,
				width: node.width,
				height: node.height
			};
			if (canSwitchToManualPositioning(realNodeBeingDragged) || isPositionedManually) {
				idea.updateAttr(
					id,
					'position',
					[
						x - parentNode.x - 0.5 * parentNode.width,
						y - parentNode.y - 0.5 * parentNode.height
					]
				);
				return;
			} else {
				if (!isPositionedManually && verticallyClosestNode && mapModel.getIdea().positionBefore(id, verticallyClosestNode.id)) {
					return;
				} else {
					mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
				}
			}
			/*
			todo:
				- updateAttr1
			*/
		},
		screenToStageCoordinates = function (x, y) {
			return {
				x: (x - stage.getX()) / (stage.getScale().x || 1),
				y: (y - stage.getY()) / (stage.getScale().y || 1)
			};
		},
		getInteractionPoint = function (evt) {
			if (evt.changedTouches && evt.changedTouches[0]) {
				return screenToStageCoordinates(evt.changedTouches[0].clientX, evt.changedTouches[0].clientY);
			}
			return screenToStageCoordinates(evt.layerX, evt.layerY);
		};
	mapModel.addEventListener('nodeCreated', function (n) {
		var node = findNodeOnStage(n.id);
		node.on('dragstart', function () {
			node.moveToTop();
			node.setShadowOffset(8);
			node.setOpacity(0.3);
		});
		node.on('dragmove', function (evt) {
			var stagePoint = getInteractionPoint(evt);
			nodeDragMove(
				n.id,
				stagePoint.x,
				stagePoint.y,
				node.getX(),
				node.getY(),
				evt.shiftKey,
				evt.metaKey
			);
		});
		node.on('dragend', function (evt) {
			var stagePoint = getInteractionPoint(evt);
			node.setShadowOffset(4);
			node.setOpacity(1);
			nodeDragEnd(
				n.id,
				stagePoint.x,
				stagePoint.y,
				node.getX(),
				node.getY(),
				evt.shiftKey,
				evt.metaKey
			);
		});
	});
};
