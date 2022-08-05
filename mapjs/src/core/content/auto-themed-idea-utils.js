/*global module, require*/
const calcIdeaLevel = require('./calc-idea-level'),
	_ = require('underscore'),
	traverse = require('./traverse'),
	addSubIdea = (activeContent, themeObj, parentId, ideaTitle, optionalNewId, optionalIdeaAttr) => {
		'use strict';
		if (!themeObj) {
			return activeContent.addSubIdea(parentId, ideaTitle, optionalNewId, optionalIdeaAttr);
		}
		const parentLevel = calcIdeaLevel(activeContent, parentId),
			parentIdea = parentId && activeContent.findSubIdeaById(parentId),
			numberOfSiblings = (parentIdea && parentIdea.ideas && Object.keys(parentIdea.ideas).length) || 0,
			attrs = themeObj.getPersistedAttributes(optionalIdeaAttr, parentLevel + 1, numberOfSiblings).attr,
			attrsToSave = (!_.isEmpty(attrs) && attrs) || undefined;
		return activeContent.addSubIdea(parentId, ideaTitle, optionalNewId, attrsToSave);
	},
	recalcAutoNodeAttrs = (activeContent, themeObj, idea, level, numberOfSiblings) => {
		'use strict';
		const updatedAttr = (idea && themeObj.getPersistedAttributes(idea.attr, level, numberOfSiblings)) || {};

		updatedAttr.removed.forEach((key) => activeContent.updateAttr(idea.id, key, false));
		Object.keys(updatedAttr.attr).forEach((key) => {
			activeContent.updateAttr(idea.id, key, updatedAttr.attr[key]);
		});
	},
	recalcIdeasAutoNodeAttrs = (activeContent, themeObj, idea, level, numberOfSiblings) => {
		'use strict';
		// console.log('recalcIdeasAutoNodeAttrs idea.id', idea.id, 'level', level, 'numberOfSiblings', numberOfSiblings); //eslint-disable-line
		if (level > 0) {
			recalcAutoNodeAttrs(activeContent, themeObj, idea, level, numberOfSiblings);
		}
		if (idea.ideas) {
			let siblingIndex = 0;
			Object.keys(idea.ideas).forEach((childIdeaKey) => {
				recalcIdeasAutoNodeAttrs(activeContent, themeObj, idea.ideas[childIdeaKey], level + 1, siblingIndex);
				siblingIndex += 1;
			});
		}
	},
	changeParent = (activeContent, themeObj, ideaId, newParentId) => {
		'use strict';
		if (!themeObj) {
			return activeContent.changeParent(ideaId, newParentId);
		}
		let result;
		const newParent = activeContent.findSubIdeaById(newParentId),
			numberOfSiblings = (newParent && newParent.ideas && Object.keys(newParent.ideas).length) || 0,
			parentLevel = calcIdeaLevel(activeContent, newParentId);

		activeContent.batch(() => {
			activeContent.changeParent(ideaId, newParentId);
			const idea = activeContent.findSubIdeaById(ideaId);
			recalcAutoNodeAttrs(activeContent, themeObj, idea, parentLevel + 1, numberOfSiblings);
			let childSiblings = 0;
			if (idea.ideas) {
				Object.keys(idea.ideas).forEach((childIdeaKey) => {
					recalcAutoNodeAttrs(activeContent, themeObj, idea.ideas[childIdeaKey], parentLevel + 2, childSiblings);
					childSiblings += 1;
				});
			}
		});
		return result;
	},
	pasteMultiple = (activeContent, themeObj, parentId, contents) => {
		'use strict';
		if (!themeObj) {
			return activeContent.pasteMultiple(parentId, contents);
		}
		const level = calcIdeaLevel(activeContent, parentId),
			parent = (parentId && activeContent.findSubIdeaById(parentId)) || activeContent,
			existingSiblings = (parent.ideas && Object.keys(parent.ideas).length) || 0;

		contents.forEach((idea) => {
			traverse(idea, (subIdea) => themeObj.cleanPersistedAttributes(subIdea.attr));
		});
		let pastedIds = false, siblings = existingSiblings;
		activeContent.batch(() => {
			pastedIds = activeContent.pasteMultiple(parentId, contents);
			if (pastedIds && pastedIds.length) {
				pastedIds.forEach((pastedId) => {
					const idea = activeContent.findSubIdeaById(pastedId);
					recalcIdeasAutoNodeAttrs(activeContent, themeObj, idea, level + 1, siblings);
					siblings += 1;
				});
			}
			return pastedIds;
		});
		return pastedIds;

	},
	insertIntermediateMultiple = (activeContent, themeObj, inFrontOfIdeaIds, ideaOptions) => {
		'use strict';
		if (!themeObj) {
			return activeContent.insertIntermediateMultiple(inFrontOfIdeaIds, ideaOptions);
		}

		const ideaOptionsSafe = _.extend({}, ideaOptions),
			inFrontOfIdeaId = themeObj && inFrontOfIdeaIds && inFrontOfIdeaIds[0],
			inFrontOfIdea = inFrontOfIdeaId && activeContent.findSubIdeaById(inFrontOfIdeaId),
			level = inFrontOfIdeaId && calcIdeaLevel(activeContent, inFrontOfIdeaId),
			insertAttr = (inFrontOfIdea && inFrontOfIdea.attr) || {},
			siblingIds = activeContent.sameSideSiblingIds(inFrontOfIdeaId),
			numberOfSiblings = (siblingIds && siblingIds.length) || 0,
			attrs = themeObj.getPersistedAttributes(insertAttr, level, numberOfSiblings).attr;

		ideaOptionsSafe.attr = _.extend({}, ideaOptionsSafe.attr, attrs);
		let result;
		activeContent.batch(() => {
			result = activeContent.insertIntermediateMultiple(inFrontOfIdeaIds, ideaOptionsSafe);
			let siblings = 0;
			inFrontOfIdeaIds.forEach((movedIdeaId) => {
				const movedIdea = activeContent.findSubIdeaById(movedIdeaId);
				recalcAutoNodeAttrs(activeContent, themeObj, movedIdea, level + 1, siblings);
				siblings += 1;
			});
		});
		return result;

	};

module.exports = {
	addSubIdea: addSubIdea,
	changeParent: changeParent,
	insertIntermediateMultiple: insertIntermediateMultiple,
	pasteMultiple: pasteMultiple,
	recalcIdeasAutoNodeAttrs: recalcIdeasAutoNodeAttrs
};
