/*jslint eqeq: true, forin: true, nomen: true*/
/*global _, MAPJS, observable*/
MAPJS.content = function (contentAggregate, sessionKey) {
	'use strict';
	var init = function (contentIdea) {
		if (contentIdea.ideas) {
			_.each(contentIdea.ideas, function (value, key) {
				contentIdea.ideas[parseFloat(key)] = init(value);
			});
		}
		if (!contentIdea.title) {
			contentIdea.title = '';
		}
		contentIdea.id = contentIdea.id || contentAggregate.nextId();
		contentIdea.containsDirectChild = contentIdea.findChildRankById = function (childIdeaId) {
			return parseFloat(
				_.reduce(
					contentIdea.ideas,
					function (res, value, key) {
						return value.id == childIdeaId ? key : res;
					},
					undefined
				)
			);
		};
		contentIdea.findSubIdeaById = function (childIdeaId) {
			var myChild = _.find(contentIdea.ideas, function (idea) {
				return idea.id == childIdeaId;
			});
			return myChild || _.reduce(contentIdea.ideas, function (result, idea) {
				return result || idea.findSubIdeaById(childIdeaId);
			}, undefined);
		};
		contentIdea.find = function (predicate) {
			var current = predicate(contentIdea) ? [_.pick(contentIdea, 'id', 'title')] : [];
			if (_.size(contentIdea.ideas) === 0) {
				return current;
			}
			return _.reduce(contentIdea.ideas, function (result, idea) {
				return _.union(result, idea.find(predicate));
			}, current);
		};
		contentIdea.getAttr = function (name) {
			if (contentIdea.attr && contentIdea.attr[name]) {
				return contentIdea.attr[name];
			}
			return false;
		};
		contentIdea.sortedSubIdeas = function () {
			if (!contentIdea.ideas) {
				return [];
			}
			var result = [],
				childKeys = _.groupBy(_.map(_.keys(contentIdea.ideas), parseFloat), function (key) { return key > 0; }),
				sortedChildKeys = _.sortBy(childKeys[true], Math.abs).concat(_.sortBy(childKeys[false], Math.abs));
			_.each(sortedChildKeys, function (key) {
				result.push(contentIdea.ideas[key]);
			});
			return result;
		};
		return contentIdea;
	},
		maxKey = function (kvMap, sign) {
			sign = sign || 1;
			if (_.size(kvMap) === 0) {
				return 0;
			}
			var currentKeys = _.keys(kvMap);
			currentKeys.push(0); /* ensure at least 0 is there for negative ranks */
			return _.max(_.map(currentKeys, parseFloat), function (x) {
				return x * sign;
			});
		},
		nextChildRank = function (parentIdea) {
			var newRank, counts, childRankSign = 1;
			if (parentIdea.id == contentAggregate.id) {
				counts = _.countBy(parentIdea.ideas, function (v, k) {
					return k < 0;
				});
				if ((counts['true'] || 0) < counts['false']) {
					childRankSign = -1;
				}
			}
			newRank = maxKey(parentIdea.ideas, childRankSign) + childRankSign;
			return newRank;
		},
		appendSubIdea = function (parentIdea, subIdea) {
			var rank;
			parentIdea.ideas = parentIdea.ideas || {};
			rank = nextChildRank(parentIdea);
			parentIdea.ideas[rank] = subIdea;
			return rank;
		},
		findIdeaById = function (ideaId) {
			ideaId = parseFloat(ideaId);
			return contentAggregate.id == ideaId ? contentAggregate : contentAggregate.findSubIdeaById(ideaId);
		},
		sameSideSiblingRanks = function (parentIdea, ideaRank) {
			return _(_.map(_.keys(parentIdea.ideas), parseFloat)).reject(function (k) {return k * ideaRank < 0; });
		},
		sign = function (number) {
			/* intentionally not returning 0 case, to help with split sorting into 2 groups */
			return number < 0 ? -1 : 1;
		},
		eventStack = [],
		redoStack = [],
		isRedoInProgress = false,
		notifyChange = function (method, args, undofunc) {
			eventStack.push({eventMethod: method, eventArgs: args, undoFunction: undofunc});
			if (isRedoInProgress) {
				contentAggregate.dispatchEvent('changed', 'redo');
			} else {
				contentAggregate.dispatchEvent('changed', method, args);
				redoStack = [];
			}
		},
		reorderChild = function (parentIdea, newRank, oldRank) {
			parentIdea.ideas[newRank] = parentIdea.ideas[oldRank];
			delete parentIdea.ideas[oldRank];
		},
		cachedId,
		upgrade = function (idea) {
			if (idea.style) {
				idea.attr = {};
				var collapsed = idea.style.collapsed;
				delete idea.style.collapsed;
				idea.attr.style = idea.style;
				if (collapsed) {
					idea.attr.collapsed = collapsed;
				}
				delete idea.style;
			}
			if (idea.ideas) {
				_.each(idea.ideas, upgrade);
			}
		};
	contentAggregate.nextId = function nextId() {
		if (!cachedId) {
			cachedId =  contentAggregate.maxId();
		}
		cachedId += 1;
		if (sessionKey) {
			return cachedId + '.' + sessionKey;
		}
		return cachedId;
	};
	contentAggregate.maxId = function maxId(idea) {
		idea = idea || contentAggregate;
		if (!idea.ideas) {
			return parseInt(idea.id, 10) || 0;
		}
		return _.reduce(
			idea.ideas,
			function (result, subidea) {
				return Math.max(result, maxId(subidea));
			},
			parseInt(idea.id, 10) || 0
		);
	};
	contentAggregate.nextSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsAfter;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsAfter = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) <= Math.abs(currentRank); });
		if (siblingsAfter.length === 0) { return false; }
		return parentIdea.ideas[_.min(siblingsAfter, Math.abs)].id;
	};
	contentAggregate.previousSiblingId = function (subIdeaId) {
		var parentIdea = contentAggregate.findParent(subIdeaId),
			currentRank,
			candidateSiblingRanks,
			siblingsBefore;
		if (!parentIdea) { return false; }
		currentRank = parentIdea.findChildRankById(subIdeaId);
		candidateSiblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
		siblingsBefore = _.reject(candidateSiblingRanks, function (k) { return Math.abs(k) >= Math.abs(currentRank); });
		if (siblingsBefore.length === 0) { return false; }
		return parentIdea.ideas[_.max(siblingsBefore, Math.abs)].id;
	};
	contentAggregate.clone = function (subIdeaId) {
		var toClone = (subIdeaId && subIdeaId != contentAggregate.id && contentAggregate.findSubIdeaById(subIdeaId)) || contentAggregate;
		return JSON.parse(JSON.stringify(toClone));
	};
	/*** private utility methods ***/
	contentAggregate.findParent = function (subIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var childRank = parentIdea.findChildRankById(subIdeaId);
		if (childRank) {
			return parentIdea;
		}
		return _.reduce(
			parentIdea.ideas,
			function (result, child) {
				return result || contentAggregate.findParent(subIdeaId, child);
			},
			false
		);
	};

	/**** aggregate command processing methods ****/
	contentAggregate.paste = function (parentIdeaId, jsonToPaste) {
		var pasteParent = (parentIdeaId == contentAggregate.id) ?  contentAggregate : contentAggregate.findSubIdeaById(parentIdeaId),
			cleanUp = function (json) {
				var result =  _.omit(json, 'ideas', 'id'), index = 1, childKeys, sortedChildKeys;
				if (json.ideas) {
					childKeys = _.groupBy(_.map(_.keys(json.ideas), parseFloat), function (key) { return key > 0; });
					sortedChildKeys = _.sortBy(childKeys[true], Math.abs).concat(_.sortBy(childKeys[false], Math.abs));
					result.ideas = {};
					_.each(sortedChildKeys, function (key) {
						result.ideas[index++] = cleanUp(json.ideas[key]);
					});
				}
				return result;
			},
			newIdea = jsonToPaste && jsonToPaste.title && init(cleanUp(jsonToPaste)),
			newRank;
		if (!pasteParent || !newIdea) {
			return false;
		}
		newRank = appendSubIdea(pasteParent, newIdea);
		notifyChange('paste', [parentIdeaId, jsonToPaste, newIdea.id], function () {
			delete pasteParent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.flip = function (ideaId) {
		var newRank, maxRank, currentRank = contentAggregate.findChildRankById(ideaId);
		if (!currentRank) {
			return false;
		}
		maxRank = maxKey(contentAggregate.ideas, -1 * sign(currentRank));
		newRank = maxRank - 10 * sign(currentRank);
		reorderChild(contentAggregate, newRank, currentRank);
		notifyChange('flip', [ideaId], function () {
			reorderChild(contentAggregate, currentRank, newRank);
		});
		return true;
	};
	contentAggregate.updateTitle = function (ideaId, title) {
		var idea = findIdeaById(ideaId), originalTitle;
		if (!idea) {
			return false;
		}
		originalTitle = idea.title;
		if (originalTitle == title) {
			return false;
		}
		idea.title = title;
		notifyChange('updateTitle', [ideaId, title], function () {
			idea.title = originalTitle;
		});
		return true;
	};
	contentAggregate.addSubIdea = function (parentId, ideaTitle) {
		var idea, parent = findIdeaById(parentId), newRank;
		if (!parent) {
			return false;
		}
		idea = init({
			title: ideaTitle
		});
		newRank = appendSubIdea(parent, idea);
		notifyChange('addSubIdea', [parentId, ideaTitle, idea.id], function () {
			delete parent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.removeSubIdea = function (subIdeaId) {
		var parent = contentAggregate.findParent(subIdeaId), oldRank, oldIdea;
		if (parent) {
			oldRank = parent.findChildRankById(subIdeaId);
			oldIdea = parent.ideas[oldRank];
			delete parent.ideas[oldRank];
			notifyChange('removeSubIdea', [subIdeaId], function () {
				parent.ideas[oldRank] = oldIdea;
			});
			return true;
		}
		return false;
	};
	contentAggregate.insertIntermediate = function (inFrontOfIdeaId, title) {
		if (contentAggregate.id == inFrontOfIdeaId) {
			return false;
		}
		var childRank, oldIdea, newIdea, parentIdea = contentAggregate.findParent(inFrontOfIdeaId);
		if (!parentIdea) {
			return false;
		}
		childRank = parentIdea.findChildRankById(inFrontOfIdeaId);
		if (!childRank) {
			return false;
		}
		oldIdea = parentIdea.ideas[childRank];
		newIdea = init({
			title: title
		});
		parentIdea.ideas[childRank] = newIdea;
		newIdea.ideas = {
			1: oldIdea
		};
		notifyChange('insertIntermediate', [inFrontOfIdeaId, title, newIdea.id], function () {
			parentIdea.ideas[childRank] = oldIdea;
		});
		return true;
	};
	contentAggregate.changeParent = function (ideaId, newParentId) {
		var oldParent, oldRank, newRank, idea, parent = findIdeaById(newParentId);
		if (ideaId == newParentId) {
			return false;
		}
		if (!parent) {
			return false;
		}
		idea = contentAggregate.findSubIdeaById(ideaId);
		if (!idea) {
			return false;
		}
		if (idea.findSubIdeaById(newParentId)) {
			return false;
		}
		if (parent.containsDirectChild(ideaId)) {
			return false;
		}
		oldParent = contentAggregate.findParent(ideaId);
		if (!oldParent) {
			return false;
		}
		oldRank = oldParent.findChildRankById(ideaId);
		newRank = appendSubIdea(parent, idea);
		delete oldParent.ideas[oldRank];
		notifyChange('changeParent', [ideaId, newParentId], function () {
			oldParent.ideas[oldRank] = idea;
			delete parent.ideas[newRank];
		});
		return true;
	};
	contentAggregate.updateAttr = function (ideaId, attrName, attrValue) {
		var idea = findIdeaById(ideaId), oldAttr;
		if (!idea) {
			return false;
		}
		oldAttr = _.extend({}, idea.attr);
		idea.attr = _.extend({}, idea.attr);
		if (!attrValue || attrValue === 'false') {
			if (!idea.attr[attrName]) {
				return false;
			}
			delete idea.attr[attrName];
		} else {
			if (_.isEqual(idea.attr[attrName], attrValue)) {
				return false;
			}
			idea.attr[attrName] = JSON.parse(JSON.stringify(attrValue));
		}
		if (_.size(idea.attr) === 0) {
			delete idea.attr;
		}
		notifyChange('updateAttr', [ideaId, attrName, attrValue], function () {
			idea.attr = oldAttr;
		});
		return true;
	};
	contentAggregate.moveRelative = function (ideaId, relativeMovement) {
		var parentIdea = contentAggregate.findParent(ideaId),
			currentRank = parentIdea && parentIdea.findChildRankById(ideaId),
			siblingRanks = currentRank && _.sortBy(sameSideSiblingRanks(parentIdea, currentRank), Math.abs),
			currentIndex = siblingRanks && siblingRanks.indexOf(currentRank),
			/* we call positionBefore, so movement down is actually 2 spaces, not 1 */
			newIndex = currentIndex + (relativeMovement > 0 ? relativeMovement + 1 : relativeMovement),
			beforeSibling = (newIndex >= 0) && parentIdea && siblingRanks && parentIdea.ideas[siblingRanks[newIndex]];
		if (newIndex < 0 || !parentIdea) {
			return false;
		}
		return contentAggregate.positionBefore(ideaId, beforeSibling && beforeSibling.id, parentIdea);
	};
	contentAggregate.positionBefore = function (ideaId, positionBeforeIdeaId, parentIdea) {
		parentIdea = parentIdea || contentAggregate;
		var newRank, afterRank, siblingRanks, candidateSiblings, beforeRank, maxRank, currentRank;
		currentRank = parentIdea.findChildRankById(ideaId);
		if (!currentRank) {
			return _.reduce(
				parentIdea.ideas,
				function (result, idea) {
					return result || contentAggregate.positionBefore(ideaId, positionBeforeIdeaId, idea);
				},
				false
			);
		}
		if (ideaId == positionBeforeIdeaId) {
			return false;
		}
		newRank = 0;
		if (positionBeforeIdeaId) {
			afterRank = parentIdea.findChildRankById(positionBeforeIdeaId);
			if (!afterRank) {
				return false;
			}
			siblingRanks = sameSideSiblingRanks(parentIdea, currentRank);
			candidateSiblings = _.reject(_.sortBy(siblingRanks, Math.abs), function (k) {
				return Math.abs(k) >= Math.abs(afterRank);
			});
			beforeRank = candidateSiblings.length > 0 ? _.max(candidateSiblings, Math.abs) : 0;
			if (beforeRank == currentRank) {
				return false;
			}
			newRank = beforeRank + (afterRank - beforeRank) / 2;
		} else {
			maxRank = maxKey(parentIdea.ideas, currentRank < 0 ? -1 : 1);
			if (maxRank == currentRank) {
				return false;
			}
			newRank = maxRank + 10 * (currentRank < 0 ? -1 : 1);
		}
		if (newRank == currentRank) {
			return false;
		}
		reorderChild(parentIdea, newRank, currentRank);

		notifyChange('positionBefore', [ideaId, positionBeforeIdeaId], function () {
			reorderChild(parentIdea, currentRank, newRank);
		});
		return true;
	};
	observable(contentAggregate);
	(function () {
		var isLinkValid = function (ideaIdFrom, ideaIdTo) {
			var isParentChild, ideaFrom, ideaTo;
			if (ideaIdFrom === ideaIdTo) {
				return false;
			}
			ideaFrom = findIdeaById(ideaIdFrom);
			if (!ideaFrom) {
				return false;
			}
			ideaTo = findIdeaById(ideaIdTo);
			if (!ideaTo) {
				return false;
			}
			isParentChild = _.find(
				ideaFrom.ideas,
				function (node) {
					return node.id === ideaIdTo;
				}
			) || _.find(
				ideaTo.ideas,
				function (node) {
					return node.id === ideaIdFrom;
				}
			);
			if (isParentChild) {
				return false;
			}
			return true;
		};
		contentAggregate.addLink = function (ideaIdFrom, ideaIdTo) {
			var alreadyExists;
			if (!isLinkValid(ideaIdFrom, ideaIdTo)) {
				return false;
			}
			alreadyExists = _.find(
				contentAggregate.links,
				function (link) {
					return link.ideaIdFrom === ideaIdFrom && link.ideaIdTo === ideaIdTo;
				}
			);
			if (alreadyExists) {
				return false;
			}
			contentAggregate.links = contentAggregate.links || [];
			contentAggregate.links.push({
				ideaIdFrom: ideaIdFrom,
				ideaIdTo: ideaIdTo
			});
			contentAggregate.dispatchEvent('changed', 'addLink', ideaIdFrom, ideaIdTo);
			return true;
		};
		contentAggregate.removeLink = function (ideaIdOne, ideaIdTwo) {
			var i = 0, link;
			while (contentAggregate.links && i < contentAggregate.links.length) {
				link = contentAggregate.links[i];
				if (link.ideaIdFrom === ideaIdOne && link.ideaIdTo === ideaIdTwo) {
					contentAggregate.links.splice(i, 1);
					contentAggregate.dispatchEvent('changed', 'removeLink', link.ideaIdFrom, link.ideaIdTo);
					return true;
				}
				i++;
			}
			return false;
		};
		contentAggregate.addEventListener('changed', function () {
			if (contentAggregate.links) {
				contentAggregate.links.forEach(function (link) {
					if (!isLinkValid(link.ideaIdFrom, link.ideaIdTo)) {
						contentAggregate.removeLink(link.ideaIdFrom, link.ideaIdTo);
					}
				});
			}
		});
	}());
	/* undo/redo */
	contentAggregate.undo = function () {
		var topEvent;
		topEvent = eventStack.pop();
		if (topEvent && topEvent.undoFunction) {
			topEvent.undoFunction();
			redoStack.push(topEvent);
			contentAggregate.dispatchEvent('changed', 'undo', []);
			return true;
		}
		return false;
	};
	contentAggregate.redo = function () {
		var topEvent;
		topEvent = redoStack.pop();
		if (topEvent) {
			isRedoInProgress = true;
			contentAggregate[topEvent.eventMethod].apply(contentAggregate, topEvent.eventArgs);
			isRedoInProgress = false;
			return true;
		}
		return false;
	};
	if (contentAggregate.formatVersion != 2) {
		upgrade(contentAggregate);
		contentAggregate.formatVersion = 2;
	}
	init(contentAggregate);
	return contentAggregate;
};
