/*global _, MAPJS*/
MAPJS.dragdrop = function (mapModel, stage) {
	'use strict';
	var currentDroppable,
		findNodeOnStage = function (nodeId) {
			return stage.get('#node_' + nodeId)[0];
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
		nodeDragMove = function (id, x, y, nodeX, nodeY, shouldCopy, shouldPositionAbsolutely) {
			var nodeId, node;
			if (!mapModel.isEditingEnabled()) {
				return;
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
				verticallyClosestNode = {
					id: null,
					y: Infinity
				},
				clone,
				idea = mapModel.getIdea(),
				parentIdea = idea.findParent(id),
				parentNode = mapModel.getCurrentLayout().nodes[parentIdea.id],
				maxSequence = 1,
				validReposition = function () {
					return nodeBeingDragged.level === 2 ||
						((nodeBeingDragged.x - parentNode.x) * (x - parentNode.x) > 0);
				};
			if (!mapModel.isEditingEnabled()) {
				mapModel.dispatchEvent('nodeMoved', nodeBeingDragged, 'failed');
				return;
			}
			updateCurrentDroppable(undefined);
			mapModel.dispatchEvent('nodeMoved', nodeBeingDragged);
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
						idea.updateAttr(id, 'position');
					}
					return;
				}

			}
			idea.startBatch();
			if (nodeBeingDragged.level === 2) {
				tryFlip(rootNode, nodeBeingDragged, x);
			}
			_.each(idea.sameSideSiblingIds(id), function (nodeId) {
				node = mapModel.getCurrentLayout().nodes[nodeId];
				if (y < node.y && node.y < verticallyClosestNode.y) {
					verticallyClosestNode = node;
				}
			});
			idea.positionBefore(id, verticallyClosestNode.id);
			if (shouldPositionAbsolutely && validReposition()) {
				mapModel.analytic('nodeManuallyPositioned');
				mapModel.selectNode(id);
				maxSequence = _.max(_.map(parentIdea.ideas, function (i) { return (i.id !== id && i.attr && i.attr.position && i.attr.position[2]) || 0; }));
				idea.updateAttr(
					id,
					'position',
					[Math.abs(nodeX - parentNode.x), nodeY - parentNode.y, maxSequence + 1]
				);
			}
			idea.endBatch();
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
				evt.shiftKey
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
				evt.shiftKey
			);
		});
	});
};
