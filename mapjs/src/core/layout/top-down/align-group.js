/*global module, require */
const _ = require('underscore'),
	compactedGroupWidth = require('./compacted-group-width'),
	sortNodesByLeftPosition = require('./sort-nodes-by-left-position');
module.exports = function alignGroup(result, rootIdea, margin) {
	'use strict';
	if (!margin) {
		throw 'invalid-args';
	}
	const nodes = result.nodes,
		rootNode = nodes[rootIdea.id],
		childIds = _.values(rootIdea.ideas).map(function (idea) {
			return idea.id;
		}),
		childNodes = childIds.map(function (id) {
			return nodes[id];
		}).filter(function (node) {
			return node;
		}),
		sortedChildNodes = sortNodesByLeftPosition(childNodes),
		getChildNodeBoundaries = function () {
			const rightMost = sortedChildNodes[sortedChildNodes.length - 1];
			return {
				left: sortedChildNodes[0].x,
				right: rightMost.x + rightMost.width
			};
		},
		setGroupWidth = function () {
			if (!childNodes.length) {
				return;
			}
			const levelBoundaries = getChildNodeBoundaries();
			rootNode.x = levelBoundaries.left;
			rootNode.width = levelBoundaries.right - levelBoundaries.left;
		},
		compactChildNodes = function () {
			if (!childNodes.length) {
				return;
			}
			const levelBoundaries = getChildNodeBoundaries(),
				levelCenter = levelBoundaries.left + (levelBoundaries.right - levelBoundaries.left) / 2,
				requiredWidth = compactedGroupWidth(childNodes, margin);
			let position = levelCenter - requiredWidth / 2;
			sortedChildNodes.forEach(node => {
				node.x = position;
				position = position + node.width + margin;
			});
		},
		sameLevelNodes = _.values(nodes).filter(function (node) {
			return node.level === rootNode.level && node.id !== rootNode.id;
		});

	compactChildNodes();
	setGroupWidth();

	sameLevelNodes.forEach(function (node) {
		node.verticalOffset = (node.verticalOffset || 0) + rootNode.height;
	});
};
