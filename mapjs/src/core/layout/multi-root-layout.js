/*global module, require*/
const _ = require('underscore'),
	layoutGeometry = require('./layout-geometry');

module.exports = function MultiRootLayout() {
	'use strict';
	const self = this,
		mergeNodes = function (storedLayout, offset) {
			_.each(storedLayout.rootLayout, function (node) {
				node.x = node.x + offset.x;
				node.y = node.y + offset.y;
				node.rootId = storedLayout.rootIdea.id;
			});
		},
		globalIdeaTopLeftPosition = function (idea) {
			const positionArray = (idea && idea.attr && idea.attr.position) || [0, 0, 0];
			return {
				x: positionArray[0],
				y: positionArray[1],
				priority: positionArray[2]
			};
		},
		toStoredLayout = function (rootLayout, rootIdea) {
			const storedLayout = {
				rootIdea: rootIdea,
				rootNode: rootLayout[rootIdea.id],
				rootLayout: rootLayout
			};
			return storedLayout;
		},
		isPositioned = function (rootIdea) {
			return globalIdeaTopLeftPosition(rootIdea).priority;
		},
		getDesiredRootNodeOffset = function (storedLayout) {
			let rootPosition = globalIdeaTopLeftPosition(storedLayout.rootIdea);
			if (!storedLayout.rootNode) {
				return {x: 0, y: 0};
			}
			if (!rootPosition || !rootPosition.priority) {
				rootPosition = {x: Math.round(storedLayout.rootNode.width / -2), y: Math.round(storedLayout.rootNode.height / -2)};
			}
			return {
				x: (rootPosition.x - storedLayout.rootNode.x),
				y: (rootPosition.y - storedLayout.rootNode.y)
			};
		},
		positionedLayouts = [],
		unpositionedLayouts = [],
		getMostRecentlyPositionedLayout = function () {
			return positionedLayouts.length && _.max(positionedLayouts, function (layout) {
				return globalIdeaTopLeftPosition(layout.rootIdea).priority;
			});
		};

	self.appendRootNodeLayout = function (rootLayout, rootIdea) {
		const storedLayout = toStoredLayout(rootLayout, rootIdea);
		if (isPositioned(rootIdea)) {
			positionedLayouts.push(storedLayout);
		} else {
			unpositionedLayouts.push(storedLayout);
		}
	};
	self.getCombinedLayout = function (margin, optional) {
		let placedLayoutPoly = [],
			result = {};

		const origin = {x: 0, y: 0},
			contextNode = optional && optional.contextNode,
			contextLayout = contextNode && positionedLayouts.find(layout => layout.rootLayout[contextNode]),
			firstToPlace = contextLayout || getMostRecentlyPositionedLayout(),
			rootDistance = function (storedLayout) {
				const rootCenter = getDesiredRootNodeOffset(storedLayout),
					nodeDistance = function (node) {
						return Math.pow(rootCenter.x + node.x + node.width / 2 - origin.x, 2) + Math.pow(rootCenter.y + node.y + node.height / 2 - origin.y, 2);
					},
					nodeDistances = Object.keys(storedLayout.rootLayout).map(key => nodeDistance(storedLayout.rootLayout[key]));
				return Math.min.apply({}, nodeDistances);
			},
			placedLayouts = [],
			layoutCount = positionedLayouts.length + unpositionedLayouts.length,
			hasMultipleLayouts = layoutCount > 1,
			positionLayout = function (storedLayout) {
				let offset, storedLayoutPoly;

				const placedRootOffset = getDesiredRootNodeOffset(storedLayout),
					initialTranslation = layoutGeometry.roundVector([placedRootOffset.x, placedRootOffset.y]),
					placeNewLayout = function () {
						const vector = layoutGeometry.unitVector([placedRootOffset.x - origin.x, placedRootOffset.y - origin.y]),
							horizontalMovement = [Math.sign(vector[0]) || 1, 0],
							verticalMovement = [0, Math.sign(vector[1]) || 1],
							horizontalTranslationResult = layoutGeometry.translatePolyToNotOverlap(storedLayoutPoly, placedLayoutPoly, initialTranslation, horizontalMovement, initialTranslation),
							horizontalExtension = layoutGeometry.extension(layoutGeometry.subtractVectors(horizontalTranslationResult.translation, initialTranslation)),
							verticalTranslationResult = horizontalExtension && layoutGeometry.translatePolyToNotOverlap(storedLayoutPoly, placedLayoutPoly, initialTranslation, verticalMovement, initialTranslation),
							verticalExtension = verticalTranslationResult && layoutGeometry.extension(layoutGeometry.subtractVectors(verticalTranslationResult.translation, initialTranslation));
						if (!verticalExtension || (horizontalExtension < verticalExtension)) {
							offset = {x: horizontalTranslationResult.translation[0], y: horizontalTranslationResult.translation[1]};
							storedLayoutPoly = horizontalTranslationResult.translatedPoly;
						} else {
							offset = {x: verticalTranslationResult.translation[0], y: verticalTranslationResult.translation[1]};
							storedLayoutPoly = verticalTranslationResult.translatedPoly;
						}
					};

				storedLayoutPoly = hasMultipleLayouts && layoutGeometry.translatePoly(layoutGeometry.tolayoutPolygonHull(storedLayout.rootLayout, margin), initialTranslation);

				if (!storedLayout || _.contains(placedLayouts, storedLayout)) {
					return;
				}

				if (placedLayouts.length) {
					placeNewLayout();
				} else {
					offset = placedRootOffset;
				}

				mergeNodes(storedLayout, offset);
				placedLayouts.push(storedLayout);
				if (hasMultipleLayouts) {
					placedLayoutPoly = placedLayoutPoly.concat(storedLayoutPoly);
				}

			};
		if (!margin) {
			throw new Error('invalid-args');
		}
		if (firstToPlace) {
			positionLayout(firstToPlace);
			if (contextLayout) {
				origin.x = contextLayout.rootLayout[contextNode].x;
				origin.y = contextLayout.rootLayout[contextNode].y;
			}
		}
		positionedLayouts.forEach(layout => layout.distance = rootDistance(layout));
		positionedLayouts.sort((layout1, layout2) => layout1.distance - layout2.distance).forEach(positionLayout);
		unpositionedLayouts.forEach(positionLayout);
		placedLayouts.forEach(function (placedLayout) {
			result = _.extend(result, placedLayout.rootLayout);
		});
		return result;
	};
};
