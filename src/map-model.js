/*jslint forin: true, nomen: true*/
/*global _, MAPJS, observable*/
MAPJS.MapModel = function (layoutCalculatorArg, selectAllTitles, clipboardProvider, defaultReorderMargin, optional) {
	'use strict';
	var self = this,
		layoutCalculator = layoutCalculatorArg,
		reorderMargin = defaultReorderMargin || 20,
		clipboard = clipboardProvider || new MAPJS.MemoryClipboard(),
		analytic,
		idea,
		currentLabelGenerator,
		isInputEnabled = true,
		isEditingEnabled = true,
		currentlySelectedIdeaId,
		activatedNodes = [],
		setActiveNodes = function (activated) {
			var wasActivated = _.clone(activatedNodes);
			if (activated.length === 0) {
				activatedNodes = [currentlySelectedIdeaId];
			} else {
				activatedNodes = activated;
			}
			self.dispatchEvent('activatedNodesChanged', _.difference(activatedNodes, wasActivated), _.difference(wasActivated, activatedNodes));
		},
		isAddLinkMode,
		applyLabels = function (newLayout) {
			var labelMap;
			if (!currentLabelGenerator) {
				return;
			}
			labelMap = currentLabelGenerator(idea);
			_.each(newLayout.nodes, function (node, id) {
				if (labelMap[id] || labelMap[id] === 0) {
					node.label = labelMap[id];
				}
			});
		},
		updateCurrentLayout = function (newLayout, sessionId) {
			var layoutCompleteOptions,
				currentLayout = layoutModel.getLayout(),
				themeChanged = (currentLayout.theme != newLayout.theme);

			self.dispatchEvent('layoutChangeStarting', _.size(newLayout.nodes) - _.size(currentLayout.nodes));
			applyLabels(newLayout);
			_.each(currentLayout.connectors, function (oldConnector, connectorId) {
				var newConnector = newLayout.connectors[connectorId];
				if (!newConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorRemoved', oldConnector);
				}
			});
			_.each(currentLayout.links, function (oldLink, linkId) {
				var newLink = newLayout.links && newLayout.links[linkId];
				if (!newLink) {
					self.dispatchEvent('linkRemoved', oldLink);
				}
			});
			_.each(currentLayout.nodes, function (oldNode, nodeId) {
				var newNode = newLayout.nodes[nodeId],
					newActive;
				if (!newNode) {
					/*jslint eqeq: true*/
					if (nodeId == currentlySelectedIdeaId) {
						self.selectNode(idea.id);
					}
					newActive = _.reject(activatedNodes, function (e) {
						return e == nodeId;
					});
					if (newActive.length !== activatedNodes.length) {
						setActiveNodes(newActive);
					}
					self.dispatchEvent('nodeRemoved', oldNode, nodeId, sessionId);
				}
			});

			_.each(newLayout.nodes, function (newNode, nodeId) {
				var oldNode = currentLayout.nodes[nodeId];
				if (!oldNode) {
					self.dispatchEvent('nodeCreated', newNode, sessionId);
				} else {
					if (newNode.x !== oldNode.x || newNode.y !== oldNode.y) {
						self.dispatchEvent('nodeMoved', newNode, sessionId);
					}
					if ((newNode.width !== oldNode.width || newNode.height !== oldNode.height) ||
						(newNode.level !== oldNode.level) ||
						(!_.isEqual(newNode.attr || {}, oldNode.attr || {})) ||
						themeChanged) {
						self.dispatchEvent('nodeAttrChanged', newNode, sessionId);
					}
					if (newNode.title !== oldNode.title) {
						self.dispatchEvent('nodeTitleChanged', newNode, sessionId);
					}
					if (newNode.label !== oldNode.label) {
						self.dispatchEvent('nodeLabelChanged', newNode, sessionId);
					}
				}
			});
			_.each(newLayout.connectors, function (newConnector, connectorId) {
				var oldConnector = currentLayout.connectors[connectorId];
				if (!oldConnector || newConnector.from !== oldConnector.from || newConnector.to !== oldConnector.to) {
					self.dispatchEvent('connectorCreated', newConnector, sessionId);
				}
			});
			_.each(newLayout.links, function (newLink, linkId) {
				var oldLink = currentLayout.links && currentLayout.links[linkId];
				if (oldLink) {
					if (!_.isEqual(newLink.attr || {}, (oldLink && oldLink.attr) || {})) {
						self.dispatchEvent('linkAttrChanged', newLink, sessionId);
					}
				} else {
					self.dispatchEvent('linkCreated', newLink, sessionId);
				}
			});
			if (themeChanged) {
				layoutCompleteOptions = {themeChanged: true};
			}
			layoutModel.setLayout(newLayout);
			if (!self.isInCollapse) {
				self.dispatchEvent('layoutChangeComplete', layoutCompleteOptions);
			}
		},
		revertSelectionForUndo,
		revertActivatedForUndo,
		selectNewIdea = function (newIdeaId) {
			revertSelectionForUndo = currentlySelectedIdeaId;
			revertActivatedForUndo = activatedNodes.slice(0);
			self.selectNode(newIdeaId);
		},
		editNewIdea = function (newIdeaId) {
			selectNewIdea(newIdeaId);
			self.editNode(false, true, true);
		},
		getCurrentlySelectedIdeaId = function () {
			return currentlySelectedIdeaId || idea.id;
		},
		paused = false,
		onIdeaChanged = function (action, args, sessionId) {
			if (paused) {
				return;
			}
			revertSelectionForUndo = false;
			revertActivatedForUndo = false;
			self.rebuildRequired(sessionId);
		},
		currentlySelectedIdea = function () {
			return (idea.findSubIdeaById(currentlySelectedIdeaId) || idea);
		},
		ensureNodeIsExpanded = function (source, nodeId) {
			var node = idea.findSubIdeaById(nodeId) || idea;
			if (node.getAttr('collapsed')) {
				idea.updateAttr(nodeId, 'collapsed', false);
			}
		},
		layoutModel = (optional && optional.layoutModel) || new MAPJS.LayoutModel({nodes: {}, connectors: {}});
	observable(this);
	analytic = self.dispatchEvent.bind(self, 'analytic', 'mapModel');
	self.pause = function () {
		paused = true;
	};
	self.resume = function () {
		paused = false;
		self.rebuildRequired();
	};
	self.getIdea = function () {
		return idea;
	};
	self.isEditingEnabled = function () {
		return isEditingEnabled;
	};
	self.getCurrentLayout = function () {
		return layoutModel.getLayout();
	};
	self.analytic = analytic;
	self.getCurrentlySelectedIdeaId = getCurrentlySelectedIdeaId;
	self.rebuildRequired = function (sessionId) {
		if (!idea) {
			return;
		}
		if (layoutModel.getLayout().theme !== (idea.attr && idea.attr.theme)) {
			self.dispatchEvent('themeChanged', idea.attr && idea.attr.theme);
		}
		updateCurrentLayout(self.reactivate(layoutCalculator(idea)), sessionId);
	};
	this.setIdea = function (anIdea) {
		if (idea) {
			idea.removeEventListener('changed', onIdeaChanged);
			paused = false;
			setActiveNodes([]);
			self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			currentlySelectedIdeaId = undefined;
		}
		idea = anIdea;
		idea.addEventListener('changed', onIdeaChanged);
		onIdeaChanged();
		self.selectNode(idea.id, true);
		self.dispatchEvent('mapViewResetRequested');
	};
	this.setEditingEnabled = function (value) {
		isEditingEnabled = value;
	};
	this.getEditingEnabled = function () {
		return isEditingEnabled;
	};
	this.setInputEnabled = function (value, holdFocus) {
		if (isInputEnabled !== value) {
			isInputEnabled = value;
			self.dispatchEvent('inputEnabledChanged', value, !!holdFocus);
		}
	};
	this.getInputEnabled = function () {
		return isInputEnabled;
	};
	this.selectNode = function (id, force, appendToActive) {
		if (force || (isInputEnabled && (id !== currentlySelectedIdeaId || !self.isActivated(id)))) {
			if (currentlySelectedIdeaId) {
				self.dispatchEvent('nodeSelectionChanged', currentlySelectedIdeaId, false);
			}
			currentlySelectedIdeaId = id;
			if (appendToActive) {
				self.activateNode('internal', id);
			} else {
				setActiveNodes([id]);
			}

			self.dispatchEvent('nodeSelectionChanged', id, true);
		}
	};
	this.clickNode = function (id, event) {
		var button = event && event.button && event.button !== -1;
		if (event && event.altKey) {
			self.toggleLink('mouse', id);
		} else if (event && event.shiftKey) {
			/*don't stop propagation, this is needed for drop targets*/
			self.toggleActivationOnNode('mouse', id);
		} else if (isAddLinkMode && !button) {
			this.toggleLink('mouse', id);
			this.toggleAddLinkMode();
		} else {
			this.selectNode(id);
			if (button && button !== -1 && isInputEnabled) {
				self.dispatchEvent('contextMenuRequested', id, event.layerX, event.layerY);
			}
		}
	};
	this.findIdeaById = function (id) {
		/*jslint eqeq:true */
		if (idea.id == id) {
			return idea;
		}
		return idea.findSubIdeaById(id);
	};
	this.getSelectedStyle = function (prop) {
		return this.getStyleForId(currentlySelectedIdeaId, prop);
	};
	this.getStyleForId = function (id, prop) {
		var node = layoutModel.getNode(id);
		return node && node.attr && node.attr.style && node.attr.style[prop];
	};
	this.toggleCollapse = function (source) {
		var selectedIdea = currentlySelectedIdea(),
			isCollapsed;
		if (self.isActivated(selectedIdea.id) && _.size(selectedIdea.ideas) > 0) {
			isCollapsed = selectedIdea.getAttr('collapsed');
		} else {
			isCollapsed = self.everyActivatedIs(function (id) {
				var node = self.findIdeaById(id);
				if (node && _.size(node.ideas) > 0) {
					return node.getAttr('collapsed');
				}
				return true;
			});
		}
		this.collapse(source, !isCollapsed);
	};
	this.collapse = function (source, doCollapse) {

		var contextNodeId = getCurrentlySelectedIdeaId(),
			contextNode = function () {
				return layoutModel.getNode(contextNodeId);
			},
			moveNodes = function (nodes, deltaX, deltaY) {
				if (deltaX || deltaY) {
					_.each(nodes, function (node) {
						node.x += deltaX;
						node.y += deltaY;
						self.dispatchEvent('nodeMoved', node, 'scroll');
					});
				}
			},
			oldContext,
			newContext;
		analytic('collapse:' + doCollapse, source);
		self.isInCollapse = true;
		oldContext = contextNode();
		if (isInputEnabled) {
			self.applyToActivated(function (id) {
				var node = self.findIdeaById(id);
				if (node && (!doCollapse || (node.ideas && _.size(node.ideas) > 0))) {
					idea.updateAttr(id, 'collapsed', doCollapse);
				}
			});
		}
		newContext = contextNode();
		if (oldContext && newContext) {
			moveNodes(
				layoutModel.getLayout().nodes,
				oldContext.x - newContext.x,
				oldContext.y - newContext.y
			);
		}
		self.isInCollapse = false;
		self.dispatchEvent('layoutChangeComplete');
	};
	this.updateStyle = function (source, prop, value) {
		/*jslint eqeq:true */
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			analytic('updateStyle:' + prop, source);
			self.applyToActivated(function (id) {
				if (self.getStyleForId(id, prop) != value) {
					idea.mergeAttrProperty(id, 'style', prop, value);
				}
			});
		}
	};
	this.updateLinkStyle = function (source, ideaIdFrom, ideaIdTo, prop, value) {
		var merged = _.extend({}, idea.getLinkAttr(ideaIdFrom, ideaIdTo, 'style'));
		if (!isEditingEnabled) {
			return false;
		}
		if (isInputEnabled) {
			analytic('updateLinkStyle:' + prop, source);
			merged[prop] = value;
			idea.updateLinkAttr(ideaIdFrom, ideaIdTo, 'style', merged);
		}
	};
	this.addSubIdea = function (source, parentId, initialTitle) {
		var target = parentId || currentlySelectedIdeaId, newId;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addSubIdea', source);
		if (isInputEnabled) {
			idea.batch(function () {
				ensureNodeIsExpanded(source, target);
				if (initialTitle) {
					newId = idea.addSubIdea(target, initialTitle);
				} else {
					newId = idea.addSubIdea(target);
				}
			});
			if (newId) {
				if (initialTitle) {
					selectNewIdea(newId);
				} else {
					editNewIdea(newId);
				}
			}
		}

	};
	self.addGroupSubidea = function (source, options) {
		var parentId = options && options.parentId,
			group = (options && options.group) || true,
			target = parentId || currentlySelectedIdeaId, newGroupId, newId;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addGroupSubidea', source);
		if (isInputEnabled) {
			idea.batch(function () {
				ensureNodeIsExpanded(source, target);
				newGroupId = idea.addSubIdea(target, 'group');
				if (newGroupId) {
					idea.updateAttr(newGroupId, 'contentLocked', true);
					idea.updateAttr(newGroupId, 'group', group);
					newId = idea.addSubIdea(newGroupId);
				}
			});
			if (newId) {
				editNewIdea(newId);
			}
		}

	};
	this.insertIntermediate = function (source) {
		var activeNodes = [], newId;
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled || currentlySelectedIdeaId === idea.id) {
			return false;
		}
		analytic('insertIntermediate', source);
		self.applyToActivated(function (i) {
			activeNodes.push(i);
		});
		newId = idea.insertIntermediateMultiple(activeNodes);
		if (newId) {
			editNewIdea(newId);
		}
	};
	this.flip = function (source) {
		var node = layoutModel.getNode(currentlySelectedIdeaId);

		if (!isEditingEnabled) {
			return false;
		}
		analytic('flip', source);
		if (!isInputEnabled || currentlySelectedIdeaId === idea.id) {
			return false;
		}
		if (!node || node.level !== 2) {
			return false;
		}

		return idea.flip(currentlySelectedIdeaId);
	};
	this.addSiblingIdeaBefore = function (source) {
		var newId, parent, contextRank, newRank;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addSiblingIdeaBefore', source);
		if (!isInputEnabled) {
			return false;
		}
		parent = idea.findParent(currentlySelectedIdeaId) || idea;
		idea.batch(function () {
			ensureNodeIsExpanded(source, parent.id);
			newId = idea.addSubIdea(parent.id);
			if (newId && currentlySelectedIdeaId !== idea.id) {
				contextRank = parent.findChildRankById(currentlySelectedIdeaId);
				newRank = parent.findChildRankById(newId);
				if (contextRank * newRank < 0) {
					idea.flip(newId);
				}
				idea.positionBefore(newId, currentlySelectedIdeaId);
			}
		});
		if (newId) {
			editNewIdea(newId);
		}
	};
	this.addSiblingIdea = function (source, optionalNodeId, optionalInitialText) {
		var newId, nextId, parent, contextRank, newRank, currentId;
		currentId = optionalNodeId || currentlySelectedIdeaId;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addSiblingIdea', source);
		if (isInputEnabled) {
			parent = idea.findParent(currentId) || idea;
			idea.batch(function () {
				ensureNodeIsExpanded(source, parent.id);
				if (optionalInitialText) {
					newId = idea.addSubIdea(parent.id, optionalInitialText);
				} else {
					newId = idea.addSubIdea(parent.id);
				}
				if (newId && currentId !== idea.id) {
					nextId = idea.nextSiblingId(currentId);
					contextRank = parent.findChildRankById(currentId);
					newRank = parent.findChildRankById(newId);
					if (contextRank * newRank < 0) {
						idea.flip(newId);
					}
					if (nextId) {
						idea.positionBefore(newId, nextId);
					}
				}
			});
			if (newId) {
				if (optionalInitialText) {
					selectNewIdea(newId);
				} else {
					editNewIdea(newId);
				}
			}
		}
	};
	this.removeSubIdea = function (source) {
		var removed;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('removeSubIdea', source);
		if (isInputEnabled) {
			self.applyToActivated(function (id) {
				/*jslint eqeq:true */
				var parent;
				if (currentlySelectedIdeaId == id) {
					parent = idea.findParent(currentlySelectedIdeaId);
					if (parent) {
						self.selectNode(parent.id);
					}
				}
				removed  = idea.removeSubIdea(id);
			});
		}
		return removed;
	};
	this.updateTitle = function (ideaId, title, isNew) {
		if (isNew) {
			idea.initialiseTitle(ideaId, title);
		} else {
			idea.updateTitle(ideaId, title);
		}
	};
	this.editNode = function (source, shouldSelectAll, editingNew) {
		var title, currentIdea;
		if (!isEditingEnabled) {
			return false;
		}
		if (source) {
			analytic('editNode', source);
		}
		if (!isInputEnabled) {
			return false;
		}
		currentIdea = currentlySelectedIdea();
		if (currentIdea.attr && currentIdea.attr.contentLocked) {
			return false;
		}
		title = currentIdea.title;
		if (_.include(selectAllTitles, title)) { // === 'Press Space or double-click to edit') {
			shouldSelectAll = true;
		}
		self.dispatchEvent('nodeEditRequested', currentlySelectedIdeaId, shouldSelectAll, !!editingNew);
	};
	this.editIcon = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (source) {
			analytic('editIcon', source);
		}
		if (!isInputEnabled) {
			return false;
		}
		self.dispatchEvent('nodeIconEditRequested', currentlySelectedIdeaId);
	};
	this.scaleUp = function (source) {
		self.scale(source, 1.25);
	};
	this.scaleDown = function (source) {
		self.scale(source, 0.8);
	};
	this.scale = function (source, scaleMultiplier, zoomPoint) {
		if (isInputEnabled) {
			self.dispatchEvent('mapScaleChanged', scaleMultiplier, zoomPoint);
			analytic(scaleMultiplier < 1 ? 'scaleDown' : 'scaleUp', source);
		}
	};
	this.move = function (source, deltaX, deltaY) {
		if (isInputEnabled) {
			self.dispatchEvent('mapMoveRequested', deltaX, deltaY);
			analytic('move', source);
		}
	};
	this.resetView = function (source) {
		if (isInputEnabled) {
			self.selectNode(idea.id);
			self.dispatchEvent('mapViewResetRequested');
			analytic('resetView', source);
		}

	};
	this.decorationAction = function (source, nodeId, decorationType) {
		analytic('decorationAction', source);
		self.dispatchEvent('decorationActionRequested', nodeId, decorationType);
	};
	this.openAttachment = function (source, nodeId) {
		var node, attachment;
		analytic('openAttachment', source);
		nodeId = nodeId || currentlySelectedIdeaId;
		node = layoutModel.getNode(nodeId);
		attachment = node && node.attr && node.attr.attachment;
		if (node) {
			self.dispatchEvent('attachmentOpened', nodeId, attachment);
		}
	};
	this.setAttachment = function (source, nodeId, attachment) {
		var hasAttachment = !!(attachment && attachment.content);
		if (!isEditingEnabled) {
			return false;
		}
		analytic('setAttachment', source);
		idea.updateAttr(nodeId, 'attachment', hasAttachment && attachment);
	};
	this.toggleLink = function (source, nodeIdTo) {
		var exists = _.find(idea.links, function (link) {
			return (String(link.ideaIdFrom) === String(nodeIdTo) && String(link.ideaIdTo) === String(currentlySelectedIdeaId)) || (String(link.ideaIdTo) === String(nodeIdTo) && String(link.ideaIdFrom) === String(currentlySelectedIdeaId));
		});
		if (exists) {
			self.removeLink(source, exists.ideaIdFrom, exists.ideaIdTo);
		} else {
			self.addLink(source, nodeIdTo);
		}
	};
	this.addLink = function (source, nodeIdTo) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addLink', source);
		idea.addLink(currentlySelectedIdeaId, nodeIdTo);
	};
	this.selectLink = function (source, link, selectionPoint) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('selectLink', source);
		if (!link) {
			return false;
		}
		self.dispatchEvent('linkSelected', link, selectionPoint, idea.getLinkAttr(link.ideaIdFrom, link.ideaIdTo, 'style'));
	};
	this.removeLink = function (source, nodeIdFrom, nodeIdTo) {
		if (!isEditingEnabled) {
			return false;
		}
		analytic('removeLink', source);
		idea.removeLink(nodeIdFrom, nodeIdTo);
	};

	this.toggleAddLinkMode = function (source) {
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled) {
			return false;
		}
		analytic('toggleAddLinkMode', source);
		isAddLinkMode = !isAddLinkMode;
		self.dispatchEvent('addLinkModeToggled', isAddLinkMode);
	};
	this.cancelCurrentAction = function (source) {
		if (!isInputEnabled) {
			return false;
		}
		if (!isEditingEnabled) {
			return false;
		}
		if (isAddLinkMode) {
			this.toggleAddLinkMode(source);
		}
	};
	self.undo = function (source) {
		var undoSelectionClone = revertSelectionForUndo,
			undoActivationClone = revertActivatedForUndo;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('undo', source);
		if (isInputEnabled) {
			idea.undo();
			if (undoSelectionClone) {
				self.selectNode(undoSelectionClone);
			}
			if (undoActivationClone) {
				setActiveNodes(undoActivationClone);
			}

		}
	};
	self.redo = function (source) {
		if (!isEditingEnabled) {
			return false;
		}

		analytic('redo', source);
		if (isInputEnabled) {
			idea.redo();
		}
	};
	self.moveRelative = function (source, relativeMovement) {
		var options;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('moveRelative', source);
		if (isInputEnabled) {
			if (layoutModel.getOrientation() === 'top-down') {
				options = {ignoreRankSide: true};
			}
			idea.moveRelative(currentlySelectedIdeaId, relativeMovement, options);
		}
	};
	self.cut = function (source) {
		var activeNodeIds = [], parents = [], firstLiveParent;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('cut', source);
		if (isInputEnabled) {
			self.applyToActivated(function (nodeId) {
				activeNodeIds.push(nodeId);
				parents.push(idea.findParent(nodeId).id);
			});
			clipboard.put(idea.cloneMultiple(activeNodeIds));
			idea.removeMultiple(activeNodeIds);
			firstLiveParent = _.find(parents, idea.findSubIdeaById);
			self.selectNode(firstLiveParent || idea.id);
		}
	};
	self.contextForNode = function (nodeId) {
		var node = self.findIdeaById(nodeId),
				hasChildren = node && node.ideas && _.size(node.ideas) > 0,
				hasSiblings = idea.hasSiblings(nodeId),
				isCollapsed = node && node.getAttr('collapsed'),
				canPaste = node && isEditingEnabled && clipboard && clipboard.get();
		if (node) {
			return {
				hasChildren: !!hasChildren,
				hasSiblings: !!hasSiblings,
				canPaste: !!canPaste,
				notRoot: idea.id != nodeId,
				canUndo: idea.canUndo(),
				canRedo: idea.canRedo(),
				canCollapse: hasChildren && !isCollapsed,
				canExpand: hasChildren && isCollapsed
			};
		}

	};
	self.copy = function (source) {
		var activeNodeIds = [];
		if (!isEditingEnabled) {
			return false;
		}
		analytic('copy', source);
		if (isInputEnabled) {
			self.applyToActivated(function (node) {
				activeNodeIds.push(node);
			});
			clipboard.put(idea.cloneMultiple(activeNodeIds));
		}
	};
	self.paste = function (source) {
		var result;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('paste', source);
		if (isInputEnabled) {
			result = idea.pasteMultiple(currentlySelectedIdeaId, clipboard.get());
			if (result && result[0]) {
				self.selectNode(result[0]);
			}
		}
	};
	self.pasteStyle = function (source) {
		var clipContents = clipboard.get(),
			pastingStyle;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('pasteStyle', source);
		if (isInputEnabled && clipContents && clipContents[0]) {
			pastingStyle = clipContents[0].attr && clipContents[0].attr.style;
			self.applyToActivated(function (id) {
				idea.updateAttr(id, 'style', pastingStyle);
			});
		}
	};
	self.getIcon = function (nodeId) {
		var node = layoutModel.getNode(nodeId || currentlySelectedIdeaId);
		if (!node) {
			return false;
		}
		return node.attr && node.attr.icon;
	};
	self.setIcon = function (source, url, imgWidth, imgHeight, position, nodeId, metaData) {
		var nodeIdea, iconObject;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('setIcon', source);
		nodeId = nodeId || currentlySelectedIdeaId;
		nodeIdea = self.findIdeaById(nodeId);
		if (!nodeIdea) {
			return false;
		}
		if (url) {
			iconObject = {
				url: url,
				width: imgWidth,
				height: imgHeight,
				position: position
			};
			if (metaData) {
				iconObject.metaData = metaData;
			}
			idea.updateAttr(nodeId, 'icon', iconObject);
		} else if (nodeIdea.title || nodeId === idea.id) {
			idea.updateAttr(nodeId, 'icon', false);
		} else {
			idea.removeSubIdea(nodeId);
		}
	};
	self.insertUp = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.addSiblingIdeaBefore(source);
		} else {
			self.insertIntermediate(source);
		}
	};
	self.insertDown = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.addSiblingIdea(source);
		} else {
			self.addSubIdea(source);
		}
	};
	self.insertLeft = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.insertIntermediate(source);
		} else {
			self.addSiblingIdeaBefore(source);
		}
	};
	self.insertRight = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.addSubIdea(source);
		} else {
			self.addSiblingIdea(source);
		}
	};
	self.moveUp = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.moveRelative(source, -1);
		}
	};
	self.moveDown = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.moveRelative(source, 1);
		}
	};
	self.moveLeft = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.flip(source);
		} else {
			self.moveRelative(source, -1);
		}
	};
	self.moveRight = function (source) {
		if (layoutModel.getOrientation() === 'standard') {
			self.flip(source);
		} else {
			self.moveRelative(source, 1);
		}
	};
	self.getSelectedNodeId = function () {
		return getCurrentlySelectedIdeaId();
	};
	self.centerOnNode = function (nodeId) {
		if (!layoutModel.getNode(nodeId)) {
			idea.startBatch();
			_.each(idea.calculatePath(nodeId), function (parent) {
				idea.updateAttr(parent.id, 'collapsed', false);
			});
			idea.endBatch();
		}
		self.dispatchEvent('nodeFocusRequested', nodeId);
		self.selectNode(nodeId);
	};
	self.search = function (query) {
		var result = [];
		query = query.toLocaleLowerCase();
		idea.traverse(function (contentIdea) {
			if (contentIdea.title && contentIdea.title.toLocaleLowerCase().indexOf(query) >= 0) {
				result.push({id: contentIdea.id, title: contentIdea.title});
			}
		});
		return result;
	};
	//node activation and selection
	(function () {
			var applyToNodeDirection = function (source, analyticTag, method, direction) {
					var relId;
					if (!isInputEnabled) {
						return;
					}
					analytic(analyticTag, source);
					relId = layoutModel['nodeId' + direction](currentlySelectedIdeaId);
					if (relId) {
						method.apply(self, [relId]);
					}
				},
				applyFuncs = {};

			['Left', 'Right', 'Up', 'Down'].forEach(function (direction) {
				applyFuncs[direction] = function (source, analyticTag, method) {
					applyToNodeDirection(source, analyticTag, method, direction);
				};
			});
			self.getActivatedNodeIds = function () {
				return activatedNodes.slice(0);
			};
			self.activateSiblingNodes = function (source) {
				var parent = idea.findParent(currentlySelectedIdeaId),
					siblingIds;
				analytic('activateSiblingNodes', source);
				if (!parent || !parent.ideas) {
					return;
				}
				siblingIds = _.map(parent.ideas, function (child) {
					return child.id;
				});
				setActiveNodes(siblingIds);
			};
			self.activateNodeAndChildren = function (source) {
				var contextId = getCurrentlySelectedIdeaId(),
					subtree = idea.getSubTreeIds(contextId);
				analytic('activateNodeAndChildren', source);
				subtree.push(contextId);
				setActiveNodes(subtree);
			};
			_.each(['Left', 'Right', 'Up', 'Down'], function (position) {
				self['activateNode' + position] = function (source) {
					applyFuncs[position](source, 'activateNode' + position, function (nodeId) {
						self.selectNode(nodeId, false, true);
					});
				};
				self['selectNode' + position] = function (source) {
					applyFuncs[position](source, 'selectNode' + position, self.selectNode);
				};
			});

			self.toggleActivationOnNode = function (source, nodeId) {
				analytic('toggleActivated', source);
				if (!self.isActivated(nodeId)) {
					setActiveNodes([nodeId].concat(activatedNodes));
				} else {
					setActiveNodes(_.without(activatedNodes, nodeId));
				}
			};
			self.activateNode = function (source, nodeId) {
				analytic('activateNode', source);
				if (!self.isActivated(nodeId)) {
					activatedNodes.push(nodeId);
					self.dispatchEvent('activatedNodesChanged', [nodeId], []);
				}
			};
			self.activateChildren = function (source) {
				var context = currentlySelectedIdea();
				analytic('activateChildren', source);
				if (!context || _.isEmpty(context.ideas) || context.getAttr('collapsed')) {
					return;
				}
				setActiveNodes(idea.getSubTreeIds(context.id));
			};
			self.activateSelectedNode = function (source) {
				analytic('activateSelectedNode', source);
				setActiveNodes([getCurrentlySelectedIdeaId()]);
			};
			self.isActivated = function (id) {
				/*jslint eqeq:true*/
				return _.find(activatedNodes, function (activeId) {
					return id == activeId;
				});
			};
			self.applyToActivated = function (toApply) {
				idea.batch(function () {
					_.each(activatedNodes, toApply);
				});
			};
			self.everyActivatedIs = function (predicate) {
				return _.every(activatedNodes, predicate);
			};
			self.activateLevel = function (source, level) {
				var toActivate = _.map(
					_.filter(
						layoutModel.getLayout().nodes,
						function (node) {
							/*jslint eqeq:true*/
							return node.level == level;
						}
					),
					function (node) {
						return node.id;
					}
				);
				analytic('activateLevel', source);
				if (!_.isEmpty(toActivate)) {
					setActiveNodes(toActivate);
				}
			};
			self.reactivate = function (layout) {
				_.each(layout.nodes, function (node) {
					if (_.contains(activatedNodes, node.id)) {
						node.activated = true;
					}
				});
				return layout;
			};
		}());

	self.getNodeIdAtPosition = function (x, y) {
		var isPointOverNode = function (node) { //move to mapModel candidate
				/*jslint eqeq: true*/
				return x >= node.x &&
					y >= node.y &&
					x <= node.x + node.width &&
					y <= node.y + node.height;
			},
			node = _.find(layoutModel.getLayout().nodes, isPointOverNode);
		return node && node.id;
	};
	self.autoPosition = function (nodeId) {
		return idea.updateAttr(nodeId, 'position', false);
	};
	self.standardPositionNodeAt = function (nodeId, x, y, manualPosition) {
		var rootNode = layoutModel.getNode(idea.id),
			verticallyClosestNode = {
				id: null,
				y: Infinity
			},
			parentIdea = idea.findParent(nodeId),
			parentNode = layoutModel.getNode(parentIdea.id),
			thisNode = layoutModel.getNode(nodeId),
			nodeBeingDragged = layoutModel.getNode(nodeId),
			tryFlip = function (rootNode, nodeBeingDragged, nodeDragEndX) {
				var flipRightToLeft = rootNode.x < nodeBeingDragged.x && nodeDragEndX < rootNode.x,
					flipLeftToRight = rootNode.x > nodeBeingDragged.x && rootNode.x < nodeDragEndX;
				if (flipRightToLeft || flipLeftToRight) {
					return idea.flip(nodeId);
				}
				return false;
			},
			maxSequence = 1,
			validReposition = function () {
				return nodeBeingDragged.level === 2 ||
					((nodeBeingDragged.x - parentNode.x) * (x - parentNode.x) > 0);
			},
			result = false,
			xOffset;
		idea.startBatch();
		if (thisNode && thisNode.level === 2) {
			result = tryFlip(rootNode, nodeBeingDragged, x);
		}
		_.each(idea.sameSideSiblingIds(nodeId), function (id) {
			var node = layoutModel.getNode(id);
			if (y < node.y && node.y < verticallyClosestNode.y) {
				verticallyClosestNode = node;
			}
		});
		if (!manualPosition && validReposition()) {
			self.autoPosition(nodeId);
		}
		result = idea.positionBefore(nodeId, verticallyClosestNode.id) || result;
		if (manualPosition && validReposition()) {
			if (x < parentNode.x) {
				xOffset = parentNode.x - x - nodeBeingDragged.width + parentNode.width; /* negative nodes will get flipped so distance is not correct out of the box */
			} else {
				xOffset = x - parentNode.x;
			}
			analytic('nodeManuallyPositioned');
			maxSequence = _.max(_.map(parentIdea.ideas, function (i) {
				return (i.id !== nodeId && i.attr && i.attr.position && i.attr.position[2]) || 0;
			}));
			result = idea.updateAttr(
				nodeId,
				'position',
				[xOffset, y - parentNode.y, maxSequence + 1]
			) || result;
		}
		idea.endBatch();
		return result;
	};
	self.topDownPositionNodeAt = function (nodeId, x, y, manualPosition) {
		var result,
			parentNode = idea.findParent(nodeId),
			closestNodeToRight, closestNodeToLeft;
		if (!parentNode) {
			return false;
		}
		if (manualPosition) {
			return false;
		}
		_.each(parentNode.ideas, function (sibling) {
			var node = layoutModel.getNode(sibling.id);
			if (sibling.id === nodeId) {
				return;
			}
			if (x < node.x && (!closestNodeToRight || (Math.abs(x - node.x) < Math.abs(x - layoutModel.getNode(closestNodeToRight.id).x)))) {
				closestNodeToRight = sibling;
			}
			if (x > (node.x + node.width) && (!closestNodeToLeft || (Math.abs(x - node.x) < Math.abs(x - layoutModel.getNode(closestNodeToLeft.id).x)))) {
				closestNodeToLeft = sibling;
			}
		});
		idea.batch(function () {
			var useLeftNode = !!(closestNodeToRight && closestNodeToRight.id && idea.findChildRankById(closestNodeToRight.id) < 0),
				closestNode = useLeftNode ? closestNodeToLeft : closestNodeToRight,
				shouldFlip = (useLeftNode == (idea.findChildRankById(nodeId) > 0));
			self.autoPosition(nodeId);
			if (shouldFlip) {
				idea.flip(nodeId);
			}
			result = idea.positionBefore(nodeId, closestNode && closestNode.id);
		});
		return result;
	};
	self.positionNodeAt = function (nodeId, x, y, manualPosition) {
		if (layoutModel.getOrientation() === 'standard') {
			return self.standardPositionNodeAt(nodeId, x, y, manualPosition);
		} else {
			return self.topDownPositionNodeAt(nodeId, x, y, manualPosition);
		}
	};
	self.dropNode = function (nodeId, dropTargetId, shiftKey) {
		var clone,
			parentIdea = idea.findParent(nodeId);
		if (dropTargetId === nodeId) {
			return false;
		}
		if (shiftKey) {
			clone = idea.clone(nodeId);
			if (clone) {
				idea.paste(dropTargetId, clone);
			}
			return false;
		}
		if (dropTargetId === parentIdea.id) {
			return self.autoPosition(nodeId);
		} else {
			return idea.changeParent(nodeId, dropTargetId);
		}
	};
	self.setLayoutCalculator = function (newCalculator) {
		layoutCalculator = newCalculator;
	};
	self.dropImage =  function (dataUrl, imgWidth, imgHeight, x, y, metaData) {
		var nodeId,
			dropOn = function (ideaId, position) {
				var scaleX = Math.min(imgWidth, 300) / imgWidth,
					scaleY = Math.min(imgHeight, 300) / imgHeight,
					scale = Math.min(scaleX, scaleY),
					existing = idea.getAttrById(ideaId, 'icon');
				self.setIcon('drag and drop', dataUrl, Math.round(imgWidth * scale), Math.round(imgHeight * scale), (existing && existing.position) || position, ideaId, metaData);
			},
			addNew = function () {
				var newId;
				idea.startBatch();
				newId = idea.addSubIdea(currentlySelectedIdeaId);
				dropOn(newId, 'center');
				idea.endBatch();
				self.selectNode(newId);
			};
		nodeId = self.getNodeIdAtPosition(x, y);
		if (nodeId) {
			return dropOn(nodeId, 'left');
		}
		addNew();
	};
	self.setLabelGenerator = function (labelGenerator) {
		currentLabelGenerator = labelGenerator;
		self.rebuildRequired();
	};
	self.getStandardReorderBoundary = function (nodeId) {
		var node = layoutModel.getNode(nodeId),
			rootNode = layoutModel.getNode(idea.id),
			isRoot = function () {
				/*jslint eqeq: true*/
				return nodeId == idea.id;
			},
			isFirstLevel = function () {
				return parentIdea.id === idea.id;
			},
			isRightHalf = function () {
				return node && rootNode && node.x >= rootNode.x;
			},
			siblingBoundary = function (siblings, side) {
				var tops = _.map(siblings, function (node) {
					return node.y;
				}),
				bottoms = _.map(siblings, function (node) {
					return node.y + node.height;
				}),
				result = {
					'minY': _.min(tops) -  reorderMargin - node.height,
					'maxY': _.max(bottoms) +  reorderMargin,
					'margin': reorderMargin
				};
				result.edge = side;
				if (side === 'left') {
					result.x = parentNode.x + parentNode.width + reorderMargin;
				} else {
					result.x = parentNode.x - reorderMargin;
				}
				return result;
			},
			parentBoundary = function (side) {
				var result = {
					'minY': parentNode.y -  reorderMargin - node.height,
					'maxY': parentNode.y + parentNode.height +  reorderMargin,
					'margin': reorderMargin
				};
				result.edge = side;
				if (side === 'left') {
					result.x = parentNode.x + parentNode.width + reorderMargin;
				} else {
					result.x = parentNode.x - reorderMargin;
				}

				return result;
			},
			otherSideSiblings = function () {
				var otherSide = _.map(parentIdea.ideas, function (subIdea) {
					return layoutModel.getNode(subIdea.id);
				});
				otherSide = _.without(otherSide, node);
				if (!_.isEmpty(sameSide)) {
					otherSide = _.difference(otherSide, sameSide);
				}
				return otherSide;
			},
			parentIdea,
			parentNode,
			boundaries = [],
			sameSide,
			opposite,
			primaryEdge,
			secondaryEdge;
		if (isRoot(nodeId)) {
			return false;
		}
		parentIdea = idea.findParent(nodeId);
		parentNode = layoutModel.getNode(parentIdea.id);
		primaryEdge = isRightHalf(nodeId) ? 'left' : 'right';
		secondaryEdge = isRightHalf(nodeId) ? 'right' : 'left';
		sameSide = _.map(idea.sameSideSiblingIds(nodeId), function (id) {
			return layoutModel.getNode(id);
		});
		if (!_.isEmpty(sameSide)) {
			boundaries.push(siblingBoundary(sameSide, primaryEdge));
		}
		boundaries.push(parentBoundary(primaryEdge));
		if (isFirstLevel()) {
			opposite = otherSideSiblings();
			if (!_.isEmpty(opposite)) {
				boundaries.push(siblingBoundary(opposite, secondaryEdge));
			}
			boundaries.push(parentBoundary(secondaryEdge));
		}
		return boundaries;
	};
	self.getTopDownReorderBoundary = function (nodeId) {
		var node = layoutModel.getNode(nodeId),
			parentNode = idea.findParent(nodeId),
			minX = Infinity, maxX = -Infinity, maxY = -Infinity,
			tolerance = 10;
		if (!parentNode) {
			return [];
		}
		_.each(parentNode.ideas, function (subIdea) {
			var siblingNode = layoutModel.getNode(subIdea.id);
			if (subIdea.id !== nodeId) {
				minX = Math.min(siblingNode.x, minX);
				maxX = Math.max(siblingNode.x + siblingNode.width, maxX);
				maxY = Math.max(siblingNode.y + siblingNode.height, maxY);
			}
		});
		return ([{
			minY: node.y - node.height - tolerance,
			maxY: maxY + tolerance,
			minX: minX - node.width - tolerance,
			maxX: maxX + tolerance,
			edge: 'top'
		}]);
	};
	self.getReorderBoundary = function (nodeId) {
		if (layoutModel.getOrientation() === 'standard') {
			return self.getStandardReorderBoundary(nodeId);
		} else {
			return self.getTopDownReorderBoundary(nodeId);
		}
	};
	self.focusAndSelect = function (nodeId) {
		self.selectNode(nodeId);
		self.dispatchEvent('nodeFocusRequested', nodeId);
	};
	self.requestContextMenu = function (eventPointX, eventPointY) {
		if (isInputEnabled && isEditingEnabled) {
			self.dispatchEvent('contextMenuRequested', currentlySelectedIdeaId, eventPointX, eventPointY);
			return true;
		}
		return false;
	};
	self.setTheme = function (themeId) {
		if (!isEditingEnabled) {
			return false;
		}
		idea.updateAttr(idea.id, 'theme', themeId);
	};
};
