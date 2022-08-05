/*global module, require*/
const _ = require('underscore');

module.exports = function calcIdeaLevel(contentIdea, nodeId, currentLevel) {
	'use strict';
	if (!contentIdea) {
		throw 'invalid-args';
	}
	if (contentIdea.id == nodeId)  { //eslint-disable-line eqeqeq
		return currentLevel || 0;
	}
	if (!nodeId) {
		return;
	}
	currentLevel = currentLevel || 1;

	const directChild = _.find(contentIdea.ideas, function (idea) {
		return idea.id == nodeId; //eslint-disable-line eqeqeq
	});
	if (directChild) {
		return currentLevel;
	}

	return _.reduce(contentIdea.ideas, function (result, idea) {
		return result || calcIdeaLevel(idea, nodeId, currentLevel + 1);
	}, undefined);
};
