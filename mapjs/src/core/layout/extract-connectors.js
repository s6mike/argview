/*global module, require */
const _ = require('underscore');
module.exports = function extractConnectors(aggregate, visibleNodes, theme) {
	'use strict';
	const result = {},
		// TODO: Remove blockParentConnectorOverride once site has been live for a while
		allowParentConnectorOverride = !(theme && (theme.connectorEditingContext || theme.blockParentConnectorOverride)),
		traverse = function (idea, parentId, isChildNode) {
			if (isChildNode) {
				const visibleNode = visibleNodes[idea.id];
				if (!visibleNode) {
					return;
				}
				if (parentId !== aggregate.id) {
					result[idea.id] = {
						type: 'connector',
						from: parentId,
						to: idea.id
					};
					if (visibleNode.attr && visibleNode.attr.parentConnector) {
						if (allowParentConnectorOverride && visibleNode.attr && visibleNode.attr.parentConnector) {
							result[idea.id].attr = _.clone(visibleNode.attr.parentConnector);
						} else if (theme && theme.connectorEditingContext && theme.connectorEditingContext.allowed && theme.connectorEditingContext.allowed.length) {
							result[idea.id].connectorEditingContext = theme.connectorEditingContext;
							result[idea.id].attr = _.pick(visibleNode.attr.parentConnector, theme.connectorEditingContext.allowed);
						}
					}
				}
			}
			if (idea.ideas) {
				Object.keys(idea.ideas).forEach(function (subNodeRank) {
					traverse(idea.ideas[subNodeRank], idea.id, true);
				});
			}
		};
	traverse(aggregate);
	return result;
};
