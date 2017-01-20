var MAPJS = MAPJS || {};

/*global MAPJS*/
MAPJS.MemoryClipboard = function () {
	'use strict';
	var self = this,
		clone = function (something) {
			if (!something) {
				return undefined;
			}
			return JSON.parse(JSON.stringify(something));
		},
		contents;
	self.get = function () {
		return clone(contents);
	};
	self.put = function (c) {
		contents = clone(c);
	};
};

/*global $, Hammer*/
/*jslint newcap:true*/
(function () {
	'use strict';
	$.fn.simpleDraggableContainer = function () {
		var currentDragObject,
			originalDragObjectPosition,
			container = this,
			drag = function (event) {

				if (currentDragObject && event.gesture) {
					var newpos = {
							top: Math.round(parseInt(originalDragObjectPosition.top, 10) + event.gesture.deltaY),
							left: Math.round(parseInt(originalDragObjectPosition.left, 10) + event.gesture.deltaX)
						};
					currentDragObject.css(newpos).trigger($.Event('mm:drag', {currentPosition: newpos, gesture: event.gesture}));
					if (event.gesture) {
						event.gesture.preventDefault();
					}
					return false;
				}
			},
			rollback = function (e) {
				var target = currentDragObject; // allow it to be cleared while animating
				if (target.attr('mapjs-drag-role') !== 'shadow') {
					target.animate(originalDragObjectPosition, {
						complete: function () {
							target.trigger($.Event('mm:cancel-dragging', {gesture: e.gesture}));
						},
						progress: function () {
							target.trigger('mm:drag');
						}
					});
				} else {
					target.trigger($.Event('mm:cancel-dragging', {gesture: e.gesture}));
				}
			};
		Hammer(this, {'drag_min_distance': 2});
		return this.on('mm:start-dragging', function (event) {
			if (!currentDragObject) {
				currentDragObject = $(event.relatedTarget);
				originalDragObjectPosition = {
					top: currentDragObject.css('top'),
					left: currentDragObject.css('left')
				};
				$(this).on('drag', drag);
			}
		}).on('mm:start-dragging-shadow', function (event) {
			var target = $(event.relatedTarget),
				clone = function () {
					var result = target.clone().addClass('drag-shadow').appendTo(container).offset(target.offset()).data(target.data()).attr('mapjs-drag-role', 'shadow'),
						scale = target.parent().data('scale') || 1;
					if (scale !== 0) {
						result.css({
							'transform': 'scale(' + scale + ')',
							'transform-origin': 'top left'
						});
					}
					return result;
				};
			if (!currentDragObject) {
				currentDragObject = clone();
				originalDragObjectPosition = {
					top: currentDragObject.css('top'),
					left: currentDragObject.css('left')
				};
				currentDragObject.on('mm:stop-dragging mm:cancel-dragging', function (e) {
					this.remove();
					e.stopPropagation();
					e.stopImmediatePropagation();
					var evt = $.Event(e.type, {
						gesture: e.gesture,
						finalPosition: e.finalPosition
					});
					target.trigger(evt);
				}).on('mm:drag', function (e) {
					target.trigger(e);
				});
				$(this).on('drag', drag);
			}
		}).on('dragend', function (e) {
			$(this).off('drag', drag);
			if (currentDragObject) {
				var evt = $.Event('mm:stop-dragging', {
					gesture: e.gesture,
					finalPosition: currentDragObject.offset()
				});
				currentDragObject.trigger(evt);
				if (evt.result === false) {
					rollback(e);
				}
				currentDragObject = undefined;
			}
		}).on('mouseleave', function (e) {
			if (currentDragObject) {
				$(this).off('drag', drag);
				rollback(e);
				currentDragObject = undefined;
			}
		}).attr('data-drag-role', 'container');
	};

	var onDrag = function (e) {
			$(this).trigger(
				$.Event('mm:start-dragging', {
					relatedTarget: this,
					gesture: e.gesture
				})
			);
			e.stopPropagation();
			e.preventDefault();
			if (e.gesture) {
				e.gesture.stopPropagation();
				e.gesture.preventDefault();
			}
		}, onShadowDrag = function (e) {
			$(this).trigger(
				$.Event('mm:start-dragging-shadow', {
					relatedTarget: this,
					gesture: e.gesture
				})
			);
			e.stopPropagation();
			e.preventDefault();
			if (e.gesture) {
				e.gesture.stopPropagation();
				e.gesture.preventDefault();
			}
		};
	$.fn.simpleDraggable = function (options) {
		if (!options || !options.disable) {
			return $(this).on('dragstart', onDrag);
		} else {
			return $(this).off('dragstart', onDrag);
		}
	};
	$.fn.shadowDraggable = function (options) {
		if (!options || !options.disable) {
			return $(this).on('dragstart', onShadowDrag);
		} else {
			return $(this).off('dragstart', onShadowDrag);
		}
	};
})();

/*jslint forin: true, nomen: true*/
/*global _, MAPJS*/
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
						if (newLayout.nodes[oldNode.rootId]) {
							self.selectNode(oldNode.rootId);
						} else {
							self.selectNode(idea.getDefaultRootId());
						}
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
			return currentlySelectedIdeaId || idea.getDefaultRootId();
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
		addSubIdeaToTargetNode = function (source, targetId, initialTitle) {
			var newId,
				targetNode = idea.findSubIdeaById(targetId) || idea;
			ensureNodeIsExpanded(source, targetId);
			if (initialTitle) {
				newId = idea.addSubIdea(targetId, initialTitle);
			} else {
				newId = idea.addSubIdea(targetId);
			}
			if (layoutModel.getOrientation() === 'top-down') {
				if (targetNode.findChildRankById(newId) < 0) {
					idea.flip(newId);
				}
			}
			return newId;
		},
		setNodePositionFromCurrentLayout = function (nodeId) {
			var node = nodeId && layoutModel.getNode(nodeId);
			if (node) {
				idea.updateAttr(nodeId, 'position', [node.x, node.y, 1]);
			}
		},
		layoutModel = (optional && optional.layoutModel) || new MAPJS.LayoutModel({nodes: {}, connectors: {}});
	MAPJS.observable(this);
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
		self.selectNode(idea.getDefaultRootId(), true);
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
				newId = addSubIdeaToTargetNode(source, target, initialTitle);
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
			target = parentId || currentlySelectedIdeaId,
			newGroupId, newId;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addGroupSubidea', source);
		if (isInputEnabled) {
			idea.batch(function () {
				newGroupId = addSubIdeaToTargetNode(source, target, 'group');
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
	this.insertIntermediateGroup = function (source, options) {
		var activeNodes = [],
			group = (options && options.group) || true;
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled || idea.isRootNode(currentlySelectedIdeaId)) {
			return false;
		}
		analytic('insertIntermediate', source);
		self.applyToActivated(function (i) {
			activeNodes.push(i);
		});
		idea.insertIntermediateMultiple(activeNodes, { title: 'group', attr: {group: group, contentLocked: true}});
	};
	this.insertIntermediate = function (source) {
		var activeNodes = [], newId;
		if (!isEditingEnabled) {
			return false;
		}
		if (!isInputEnabled) {
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
		if (!isInputEnabled || idea.isRootNode(currentlySelectedIdeaId)) {
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
		if (idea.isRootNode(currentlySelectedIdeaId)) {
			parent = idea;
		} else {
			parent = idea.findParent(currentlySelectedIdeaId);
		}
		idea.batch(function () {
			if (parent !== idea) {
				ensureNodeIsExpanded(source, parent.id);
			}
			newId = idea.addSubIdea(parent.id);
			if (newId) {
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

			if (idea.isRootNode(currentId)) {
				parent = idea;
			} else {
				parent = idea.findParent(currentId);
			}
			idea.batch(function () {
				if (parent !== idea) {
					ensureNodeIsExpanded(source, parent.id);
				}
				if (optionalInitialText) {
					newId = idea.addSubIdea(parent.id, optionalInitialText);
				} else {
					newId = idea.addSubIdea(parent.id);
				}
				if (newId) {
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
		var selectedNode = layoutModel.getNode(currentlySelectedIdeaId),
			localRoot = (selectedNode && selectedNode.rootId) || idea.getDefaultRootId();
		if (isInputEnabled) {
			self.selectNode(localRoot);
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
			self.selectNode(firstLiveParent || idea.getDefaultRootId());
		}
	};
	self.contextForNode = function (nodeId) {
		var node = self.findIdeaById(nodeId),
				hasChildren = node && node.ideas && _.size(node.ideas) > 0,
				rootCount = _.size(idea.ideas),
				hasSiblings = idea.hasSiblings(nodeId),
				hasPreferredWidth = node && node.attr && node.attr.style && node.attr.style.width,
				isCollapsed = node && node.getAttr('collapsed'),
				canPaste = node && isEditingEnabled && clipboard && clipboard.get(),
				isRoot = idea.isRootNode(nodeId);
		if (node) {
			return {
				hasChildren: !!hasChildren,
				hasSiblings: !!hasSiblings,
				hasPreferredWidth: !!hasPreferredWidth,
				canPaste: !!canPaste,
				notRoot: !isRoot,
				notLastRoot: !isRoot || (rootCount > 1),
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
		return result;
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
		} else {
			idea.updateAttr(nodeId, 'icon', false);
			if (!nodeIdea.title && _.size(nodeIdea.ideas) === 0) {
				idea.removeSubIdea(nodeId);
			}
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
		var rootNode = layoutModel.getNode(layoutModel.getNode(nodeId).rootId),
			getVerticallyClosestNode = function () {
				var verticallyClosestNode = {
					id: null,
					y: Infinity
				};
				_.each(idea.sameSideSiblingIds(nodeId), function (id) {
					var node = layoutModel.getNode(id);
					if (y < node.y && node.y < verticallyClosestNode.y) {
						verticallyClosestNode = node;
					}
				});
				return verticallyClosestNode;
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
			validReposition = function () {
				return nodeBeingDragged.level <= 2 ||
					((nodeBeingDragged.x - parentNode.x) * (x - parentNode.x) > 0);
			},
			result = false,
			getMaxSequence = function () {
				if (_.isEmpty(parentIdea.ideas)) {
					return 0;
				}
				return _.max(_.map(parentIdea.ideas, function (i) {
					return (i.id !== nodeId && i.attr && i.attr.position && i.attr.position[2]) || 0;
				})) || 0;
			},
			manuallyPositionSubNode = function () {
				var xOffset;
				if (x < parentNode.x) {
					xOffset = parentNode.x - x - nodeBeingDragged.width + parentNode.width; /* negative nodes will get flipped so distance is not correct out of the box */
				} else {
					xOffset = x - parentNode.x;
				}
				analytic('nodeManuallyPositioned');
				return idea.updateAttr(
					nodeId,
					'position',
					[xOffset, y - parentNode.y, getMaxSequence() + 1]
				);
			},
			manuallyPositionRootNode = function () {
				return idea.updateAttr(
					nodeId,
					'position',
					[x, y, getMaxSequence() + 1]
				);
			};

		idea.startBatch();
		if (thisNode && thisNode.level === 2) {
			result = tryFlip(rootNode, nodeBeingDragged, x);
		}
		if (!manualPosition && validReposition()) {
			self.autoPosition(nodeId);
		}
		if (nodeBeingDragged.level > 1) {
			result = idea.positionBefore(nodeId, getVerticallyClosestNode().id) || result;
		}
		if (manualPosition && validReposition()) {
			if (nodeBeingDragged.level === 1) {
				result = manuallyPositionRootNode();
			} else {
				result = manuallyPositionSubNode() || result;
			}
		}
		idea.endBatch();
		return result;
	};
	self.topDownPositionNodeAt = function (nodeId, x, y, manualPosition) {
		var result,
			parentNode = idea.findParent(nodeId),
			nodeBeingDragged = layoutModel.getNode(nodeId),
			closestNodeToRight, closestNodeToLeft,
			isRoot = function () {
				return nodeBeingDragged.level < 2;
			},
			manuallyPositionRootNode = function () {
				return idea.updateAttr(
					nodeId,
					'position',
					[x, y, 1]
				);
			};
		if (manualPosition) {
			if (isRoot()) {
				return manuallyPositionRootNode();
			} else {
				return idea.batch(function () {
					idea.changeParent(nodeId, 'root');
					return manuallyPositionRootNode();
				});
			}
		}
		if (!parentNode) {
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
				shouldFlip = (useLeftNode && (idea.findChildRankById(nodeId) > 0));
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
	self.setLabelGenerator = function (labelGenerator, labelGeneratorName) {
		currentLabelGenerator = labelGenerator;
		self.dispatchEvent('labelGeneratorChange', labelGeneratorName, !!labelGenerator);
		self.rebuildRequired();
	};
	self.getStandardReorderBoundary = function (nodeId) {
		var node = layoutModel.getNode(nodeId),
			rootNode = layoutModel.getNode(node && node.rootId),
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
		if (node.level === 1) {
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
		if (node.level === 2) {
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
			tolerance = 10,
			hasSiblings = false;
		if (!parentNode) {
			return [];
		}
		_.each(parentNode.ideas, function (subIdea) {
			var siblingNode = layoutModel.getNode(subIdea.id);

			if (siblingNode && subIdea.id !== nodeId) {
				hasSiblings = true;
				minX = Math.min(siblingNode.x, minX);
				maxX = Math.max(siblingNode.x + siblingNode.width, maxX);
				maxY = Math.max(siblingNode.y + siblingNode.height, maxY);
			}
		});
		if (!hasSiblings) {
			return [];
		}
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
	self.makeSelectedNodeRoot = function () {
		var nodeId = self.getSelectedNodeId(),
			node = nodeId && layoutModel.getNode(nodeId),
			oldRootId = node && node.rootId;
		if (!nodeId || idea.isRootNode(nodeId)) {
			return false;
		}
		if (isInputEnabled && isEditingEnabled) {
			return idea.batch(function () {
				var result;
				result = idea.changeParent(nodeId, 'root');
				if (layoutModel.getOrientation() === 'top-down') {
					if (!idea.getAttrById(oldRootId, 'position')) {
						setNodePositionFromCurrentLayout(oldRootId);
					}
					setNodePositionFromCurrentLayout(nodeId);
				}
				return result;
			});
		}
	};
	self.setNodeWidth = function (source, id, width) {
		idea.mergeAttrProperty(id, 'style', 'width', width);
	};
	self.unsetSelectedNodeWidth = function () {
		var id = self.getSelectedNodeId();
		idea.mergeAttrProperty(id, 'style', 'width', false);
	};
	self.insertRoot = function (source, initialTitle) {
		var newId;
		if (!isEditingEnabled) {
			return false;
		}
		analytic('addRootNode', source);
		if (isInputEnabled) {
			if (initialTitle) {
				newId = idea.addSubIdea(idea.id, initialTitle);
			} else {
				newId = idea.addSubIdea(idea.id);
			}
			if (newId) {
				if (initialTitle) {
					selectNewIdea(newId);
				} else {
					editNewIdea(newId);
				}
			}
		}
	};
};

/*global jQuery*/
jQuery.fn.mapToolbarWidget = function (mapModel) {
	'use strict';
	var clickMethodNames = ['insertIntermediate', 'scaleUp', 'scaleDown', 'addSubIdea', 'editNode', 'removeSubIdea', 'toggleCollapse', 'addSiblingIdea', 'undo', 'redo',
			'copy', 'cut', 'paste', 'resetView', 'openAttachment', 'toggleAddLinkMode', 'activateChildren', 'activateNodeAndChildren', 'activateSiblingNodes', 'editIcon', 'insertRoot', 'makeSelectedNodeRoot'],
		changeMethodNames = ['updateStyle'];
	return this.each(function () {
		var element = jQuery(this), preventRoundtrip = false;
		mapModel.addEventListener('nodeSelectionChanged', function () {
			preventRoundtrip = true;
			element.find('.updateStyle[data-mm-target-property]').val(function () {
				return mapModel.getSelectedStyle(jQuery(this).data('mm-target-property'));
			}).change();
			preventRoundtrip = false;
		});
		mapModel.addEventListener('addLinkModeToggled', function () {
			element.find('.toggleAddLinkMode').toggleClass('active');
		});
		clickMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).click(function () {
				if (mapModel[methodName]) {
					mapModel[methodName]('toolbar');
				}
			});
		});
		changeMethodNames.forEach(function (methodName) {
			element.find('.' + methodName).change(function () {
				if (preventRoundtrip) {
					return;
				}
				var tool = jQuery(this);
				if (tool.data('mm-target-property')) {
					mapModel[methodName]('toolbar', tool.data('mm-target-property'), tool.val());
				}
			});
		});
	});
};

/*global jQuery*/
jQuery.fn.linkEditWidget = function (mapModel) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this), currentLink, width, height, colorElement, lineStyleElement, arrowElement;
		colorElement = element.find('.color');
		lineStyleElement = element.find('.lineStyle');
		arrowElement = element.find('.arrow');
		mapModel.addEventListener('linkSelected', function (link, selectionPoint, linkStyle) {
			currentLink = link;
			element.show();
			width = width || element.width();
			height = height || element.height();
			element.css({
				top: (selectionPoint.y - 0.5 * height - 15) + 'px',
				left: (selectionPoint.x - 0.5 * width - 15) + 'px'
			});
			colorElement.val(linkStyle.color).change();
			lineStyleElement.val(linkStyle.lineStyle);
			arrowElement[linkStyle.arrow ? 'addClass' : 'removeClass']('active');
		});
		mapModel.addEventListener('mapMoveRequested', function () {
			element.hide();
		});
		element.find('.delete').click(function () {
			mapModel.removeLink('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo);
			element.hide();
		});
		colorElement.change(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'color', jQuery(this).val());
		});
		lineStyleElement.find('a').click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'lineStyle', jQuery(this).text());
		});
		arrowElement.click(function () {
			mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'arrow', !arrowElement.hasClass('active'));
		});
		element.mouseleave(element.hide.bind(element));
	});
};

/*global jQuery, FileReader, Image, MAPJS, document, _ */
MAPJS.getDataURIAndDimensions = function (src, corsProxyUrl) {
	'use strict';
	var isDataUri = function (string) {
			return (/^data:image/).test(string);
		},
		convertSrcToDataUri = function (img) {
			if (isDataUri(img.src)) {
				return img.src;
			}
			var canvas = document.createElement('canvas'),
				ctx;
			canvas.width = img.width;
			canvas.height = img.height;
			ctx = canvas.getContext('2d');
			ctx.drawImage(img, 0, 0);
			return canvas.toDataURL('image/png');
		},
		deferred = jQuery.Deferred(),
		domImg = new Image();

	domImg.onload = function () {
		try {
			deferred.resolve({dataUri: convertSrcToDataUri(domImg), width: domImg.width, height: domImg.height});
		} catch (e) {
			deferred.reject();
		}
	};
	domImg.onerror = function () {
		deferred.reject();
	};
	if (!isDataUri(src)) {
		if (corsProxyUrl) {
			domImg.crossOrigin = 'Anonymous';
			src = corsProxyUrl + encodeURIComponent(src);
		} else {
			deferred.reject('no-cors');
		}
	}
	domImg.src = src;
	return deferred.promise();
};
MAPJS.ImageInsertController = function (corsProxyUrl, resourceConverter) {
	'use strict';
	var self = MAPJS.observable(this),
		readFileIntoDataUrl = function (fileInfo) {
			var loader = jQuery.Deferred(),
				fReader = new FileReader();
			fReader.onload = function (e) {
				loader.resolve(e.target.result);
			};
			fReader.onerror = loader.reject;
			fReader.onprogress = loader.notify;
			fReader.readAsDataURL(fileInfo);
			return loader.promise();
		};
	self.insertDataUrl = function (dataUrl, evt) {
		self.dispatchEvent('imageLoadStarted');
		MAPJS.getDataURIAndDimensions(dataUrl, corsProxyUrl).then(
			function (result) {
				var storeUrl = result.dataUri;
				if (resourceConverter) {
					storeUrl = resourceConverter(storeUrl);
				}
				self.dispatchEvent('imageInserted', storeUrl, result.width, result.height, evt);
			},
			function (reason) {
				self.dispatchEvent('imageInsertError', reason);
			}
		);
	};
	self.insertFiles = function (files, evt) {
		jQuery.each(files, function (idx, fileInfo) {
			if (/^image\//.test(fileInfo.type)) {
				jQuery.when(readFileIntoDataUrl(fileInfo)).done(function (dataUrl) {
					self.insertDataUrl(dataUrl, evt);
				});
			}
		});
	};
	self.insertHtmlContent = function (htmlContent, evt) {
		var images = htmlContent.match(/img[^>]*src="([^"]*)"/);
		if (images && images.length > 0) {
			_.each(images.slice(1), function (dataUrl) {
				self.insertDataUrl(dataUrl, evt);
			});
		}
	};
};
jQuery.fn.imageDropWidget = function (imageInsertController) {
	'use strict';
	this.on('dragenter dragover', function (e) {
		if (e.originalEvent.dataTransfer) {
			return false;
		}
	}).on('drop', function (e) {
		var dataTransfer = e.originalEvent.dataTransfer,
			htmlContent;
		e.stopPropagation();
		e.preventDefault();
		if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
			imageInsertController.insertFiles(dataTransfer.files, e.originalEvent);
		} else if (dataTransfer) {
			htmlContent = dataTransfer.getData('text/html');
			imageInsertController.insertHtmlContent(htmlContent, e.originalEvent);
		}
	});
	return this;
};

/*global jQuery, _, MAPJS, document, window*/

jQuery.fn.setThemeClassList = function (classList) {
	'use strict';
	var domElement = this[0],
		filterClasses = function (classes) {
			return _.filter(classes, function (c) {
				return /^level_.+/.test(c) ||  /^attr_.+/.test(c);
			});
		},
		toRemove = filterClasses(domElement.classList),
		toAdd = classList && classList.length && filterClasses(classList);
	domElement.classList.remove.apply(domElement.classList, toRemove);
	if (toAdd && toAdd.length) {
		domElement.classList.add.apply(domElement.classList, toAdd);
	}
	return this;
};

MAPJS.DOMRender = {
	svgPixel: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"></svg>',
	nodeCacheMark: function (idea, levelOverride) {
		'use strict';
		return {
			title: idea.title,
			width: idea.attr && idea.attr.style && idea.attr.style.width,
			theme: MAPJS.DOMRender.theme &&  MAPJS.DOMRender.theme.name,
			icon: idea.attr && idea.attr.icon && _.pick(idea.attr.icon, 'width', 'height', 'position'),
			collapsed: idea.attr && idea.attr.collapsed,
			note: !!(idea.attr && idea.attr.note),
			styles:  MAPJS.DOMRender.theme &&  MAPJS.DOMRender.theme.nodeStyles(idea.level  || levelOverride, idea.attr),
			level: idea.level || levelOverride
		};
	},
	dummyTextBox: jQuery('<div>').addClass('mapjs-node').css({position: 'absolute', visibility: 'hidden'}),
	dimensionProvider: function (idea, level) {
		'use strict'; /* support multiple stages? */
		var textBox = jQuery(document).nodeWithId(idea.id),
			translateToPixel = function () {
				return MAPJS.DOMRender.svgPixel;
			},
			result;
		if (textBox && textBox.length > 0) {
			if (_.isEqual(textBox.data('nodeCacheMark'), MAPJS.DOMRender.nodeCacheMark(idea, level))) {
				return _.pick(textBox.data(), 'width', 'height');
			}
		}
		textBox = MAPJS.DOMRender.dummyTextBox;
		textBox.appendTo('body').updateNodeContent(idea, translateToPixel, level);
		result = {
			width: textBox.outerWidth(true),
			height: textBox.outerHeight(true)
		};
		textBox.detach();
		return result;
	},
	layoutCalculator: function (contentAggregate) {
		'use strict';
		return MAPJS.calculateLayout(contentAggregate, MAPJS.DOMRender.dimensionProvider, {
			theme: MAPJS.DOMRender.theme
		});
	},
	fixedLayout: false
};
MAPJS.createSVG = function (tag) {
	'use strict';
	return jQuery(document.createElementNS('http://www.w3.org/2000/svg', tag || 'svg'));
};
jQuery.fn.getBox = function () {
	'use strict';
	var domShape = this && this[0];
	if (!domShape) {
		return false;
	}
	return {
		top: domShape.offsetTop,
		left: domShape.offsetLeft,
		width: domShape.offsetWidth,
		height: domShape.offsetHeight
	};
};
jQuery.fn.getDataBox = function () {
	'use strict';
	var domShapeData = this.data();
	if (domShapeData && domShapeData.width && domShapeData.height) {
		return {
			top: domShapeData.y,
			left: domShapeData.x,
			width: domShapeData.width,
			height: domShapeData.height
		};
	}
	return this.getBox();
};


jQuery.fn.animateConnectorToPosition = function (animationOptions, tolerance) {
	'use strict';
	var element = jQuery(this),
		shapeFrom = element.data('nodeFrom'),
		shapeTo = element.data('nodeTo'),
		fromBox = shapeFrom && shapeFrom.getDataBox(),
		toBox = shapeTo && shapeTo.getDataBox(),
		oldBox = {
			from: shapeFrom && shapeFrom.getBox(),
			to: shapeTo && shapeTo.getBox()
		};
	tolerance = tolerance || 1;
	if (fromBox && toBox && oldBox && oldBox.from.width === fromBox.width &&
		oldBox.to.width   === toBox.width   &&
		oldBox.from.height  === fromBox.height    &&
		oldBox.to.height  === toBox.height    &&
		Math.abs(oldBox.from.top - oldBox.to.top - (fromBox.top - toBox.top)) < tolerance &&
		Math.abs(oldBox.from.left - oldBox.to.left - (fromBox.left - toBox.left)) < tolerance) {

		element.animate({
			left: Math.round(Math.min(fromBox.left, toBox.left)),
			top: Math.round(Math.min(fromBox.top, toBox.top))
		}, animationOptions);
		return true;
	}
	return false;
};
jQuery.fn.queueFadeOut = function (options) {
	'use strict';
	var element = this;
	return element.fadeOut(_.extend({
		complete: function () {
			if (element.is(':focus')) {
				element.parents('[tabindex]').focus();
			}
			element.remove();
		}
	}, options));
};
jQuery.fn.queueFadeIn = function (options) {
	'use strict';
	var element = this;
	return element
		.css('opacity', 0)
		.animate(
			{'opacity': 1},
			_.extend({ complete: function () {
				element.css('opacity', '');
			}}, options)
		);
};

jQuery.fn.updateStage = function () {
	'use strict';
	var data = this.data(),
		size = {
			'min-width': Math.round(data.width - data.offsetX),
			'min-height': Math.round(data.height - data.offsetY),
			'width': Math.round(data.width - data.offsetX),
			'height': Math.round(data.height - data.offsetY),
			'transform-origin': 'top left',
			'transform': 'translate3d(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px, 0)'
		};
	if (data.scale && data.scale !== 1) {
		size.transform = 'scale(' + data.scale + ') translate(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px)';
	}
	this.css(size);
	return this;
};

MAPJS.DOMRender.appendUnderLine = function (connectorCurve, calculatedConnector, position) {
	'use strict';
	if (calculatedConnector.nodeUnderline) {
		connectorCurve.d += 'M' + (calculatedConnector.nodeUnderline.from.x - position.left) + ',' + (calculatedConnector.nodeUnderline.from.y - position.top) + ' H' + (calculatedConnector.nodeUnderline.to.x - position.left);
	}
	return connectorCurve;
};

jQuery.fn.updateConnector = function (canUseData) {
	'use strict';
	return jQuery.each(this, function () {
		var element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			connection, pathElement, fromBox, toBox, changeCheck,
			applyInnerRect = function (shape, box) {
				var innerRect = shape.data().innerRect;
				if (innerRect) {
					box.left += innerRect.dx;
					box.top += innerRect.dy;
					box.width = innerRect.width;
					box.height = innerRect.height;
				}
			};
		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		if (canUseData) {
			fromBox = shapeFrom.getDataBox();
			toBox = shapeTo.getDataBox();
		} else {
			fromBox = shapeFrom.getBox();
			toBox = shapeTo.getBox();
		}
		applyInnerRect(shapeFrom, fromBox);
		applyInnerRect(shapeTo, toBox);
		/*
		fromBox.level = shapeFrom.attr('mapjs-level');
		toBox.level = shapeTo.attr('mapjs-level');
		*/
		fromBox.styles = shapeFrom.data('styles');
		toBox.styles = shapeTo.data('styles');
		changeCheck = {from: fromBox, to: toBox, theme: MAPJS.DOMRender.theme &&  MAPJS.DOMRender.theme.name };
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}
		element.data('changeCheck', changeCheck);
		connection = MAPJS.Connectors.themePath(fromBox, toBox, MAPJS.DOMRender.theme);
		pathElement = element.find('path');
		element.css(connection.position);
		if (pathElement.length === 0) {
			pathElement = MAPJS.createSVG('path').attr('class', 'mapjs-connector').appendTo(element);
		}

		// if only the relative position changed, do not re-update the curve!!!!
		pathElement.attr({
			'd': connection.d,
			'stroke': connection.color,
			'stroke-width': connection.width,
			fill: 'transparent'
		});
	});
};

jQuery.fn.updateLink = function () {
	'use strict';
	return jQuery.each(this, function () {
		var element = jQuery(this),
			shapeFrom = element.data('nodeFrom'),
			shapeTo = element.data('nodeTo'),
			connection,
			pathElement = element.find('path.mapjs-link'),
			hitElement = element.find('path.mapjs-link-hit'),
			arrowElement = element.find('path.mapjs-arrow'),
			n = Math.tan(Math.PI / 9),
			dashes = {
				dashed: '8, 8',
				solid: ''
			},
			attrs = _.pick(element.data(), 'lineStyle', 'arrow', 'color'),
			fromBox, toBox, changeCheck,
			a1x, a1y, a2x, a2y, len, iy, m, dx, dy;
		if (!shapeFrom || !shapeTo || shapeFrom.length === 0 || shapeTo.length === 0) {
			element.hide();
			return;
		}
		fromBox = shapeFrom.getBox();
		toBox = shapeTo.getBox();

		changeCheck = {from: fromBox, to: toBox, attrs: attrs};
		if (_.isEqual(changeCheck, element.data('changeCheck'))) {
			return;
		}

		element.data('changeCheck', changeCheck);

		connection = MAPJS.Connectors.linkPath(fromBox, toBox);
		element.css(connection.position);

		if (pathElement.length === 0) {
			pathElement = MAPJS.createSVG('path').attr('class', 'mapjs-link').appendTo(element);
		}
		pathElement.attr({
			'd': connection.d,
			'stroke-dasharray': dashes[attrs.lineStyle]
		}).css('stroke', attrs.color);

		if (hitElement.length === 0) {
			hitElement = MAPJS.createSVG('path').attr('class', 'mapjs-link-hit').appendTo(element);
		}
		hitElement.attr({
			'd': connection.d
		});

		if (attrs.arrow) {
			if (arrowElement.length === 0) {
				arrowElement = MAPJS.createSVG('path').attr('class', 'mapjs-arrow').appendTo(element);
			}
			len = 14;
			dx = connection.conn.to.x - connection.conn.from.x;
			dy = connection.conn.to.y - connection.conn.from.y;
			if (dx === 0) {
				iy = dy < 0 ? -1 : 1;
				a1x = connection.conn.to.x + len * Math.sin(n) * iy;
				a2x = connection.conn.to.x - len * Math.sin(n) * iy;
				a1y = connection.conn.to.y - len * Math.cos(n) * iy;
				a2y = connection.conn.to.y - len * Math.cos(n) * iy;
			} else {
				m = dy / dx;
				if (connection.conn.from.x < connection.conn.to.x) {
					len = -len;
				}
				a1x = connection.conn.to.x + (1 - m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a1y = connection.conn.to.y + (m + n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a2x = connection.conn.to.x + (1 + m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				a2y = connection.conn.to.y + (m - n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
			}
			arrowElement.attr('d',
				'M' + Math.round(a1x - connection.position.left) + ',' + Math.round(a1y - connection.position.top) +
				'L' + Math.round(connection.conn.to.x - connection.position.left) + ',' + Math.round(connection.conn.to.y - connection.position.top) +
				'L' + Math.round(a2x - connection.position.left) + ',' + Math.round(a2y - connection.position.top) +
				'Z')
				.css('fill', attrs.color)
				.show();
		} else {
			arrowElement.hide();
		}

	});
};

jQuery.fn.addNodeCacheMark = function (idea) {
	'use strict';
	this.data('nodeCacheMark', MAPJS.DOMRender.nodeCacheMark(idea));
};

jQuery.fn.updateNodeContent = function (nodeContent, resourceTranslator, forcedLevel) {
	'use strict';
	var self = jQuery(this),
		textSpan = function () {
			var span = self.find('[data-mapjs-role=title]');
			if (span.length === 0) {
				span = jQuery('<span>').attr('data-mapjs-role', 'title').appendTo(self);
			}
			return span;
		},
		decorations = function () {
			var element = self.find('[data-mapjs-role=decorations]');
			if (element.length === 0) {
				element = jQuery('<div data-mapjs-role="decorations" class="mapjs-decorations">').on('mousedown click', function (e) {
					e.stopPropagation();
					e.stopImmediatePropagation();
				}).appendTo(self);
			}
			return element;
		},
		applyLinkUrl = function (title) {
			var url = MAPJS.URLHelper.getLink(title),
				element = self.find('a.mapjs-hyperlink');
			if (!url) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a target="_blank" class="mapjs-hyperlink icon-hyperlink"></a>').addClass().appendTo(decorations());
			}
			element.attr('href', url).show();
		},
		applyLabel = function (label) {
			var element = self.find('.mapjs-label');
			if (!label && label !== 0) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<span class="mapjs-label"></span>').appendTo(decorations());
			}
			element.text(label).show();
		},
		applyAttachment = function () {
			var attachment = nodeContent.attr && nodeContent.attr.attachment,
				element = self.find('a.mapjs-attachment');
			if (!attachment) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a href="#" class="mapjs-attachment icon-attachment"></a>').
					appendTo(decorations()).click(function () {
					self.trigger('attachment-click');
					self.trigger('decoration-click', 'attachment');
				});
			}
			element.show();
		},
		applyNote = function () {
			var note = nodeContent.attr && nodeContent.attr.note,
				element = self.find('a.mapjs-note');
			if (!note) {
				element.hide();
				return;
			}
			if (element.length === 0) {
				element = jQuery('<a href="#" class="mapjs-note icon-note"></a>').appendTo(decorations()).click(function () {
					self.trigger('decoration-click', 'note');
				});
			}
			element.show();
		},
		updateText = function (title) {
			var text = MAPJS.formattedNodeTitle(title, 25),
					nodeTextPadding = MAPJS.DOMRender.nodeTextPadding || 11,
					element = textSpan(),
					domElement = element[0],
					preferredWidth = nodeContent.attr && nodeContent.attr.style && nodeContent.attr.style.width,
					height;

			element.text(text.trim());
			self.data('title', title);
			element.css({'max-width': '', 'min-width': ''});
			if (preferredWidth) {
				element.css({'max-width': preferredWidth, 'min-width': preferredWidth});
			}
			if ((domElement.scrollWidth - nodeTextPadding) > domElement.offsetWidth) {
				element.css('max-width', domElement.scrollWidth + 'px');
			} else if (!preferredWidth) {
				height = domElement.offsetHeight;
				element.css('min-width', element.css('max-width'));
				if (domElement.offsetHeight === height) {
					element.css('min-width', '');
				}
			}
		},
		setCollapseClass = function () {
			if (nodeContent.attr && nodeContent.attr.collapsed) {
				self.addClass('collapsed');
			} else {
				self.removeClass('collapsed');
			}
		},
		setColors = function (colorText) {
			var fromStyle = nodeContent.attr && nodeContent.attr.style && nodeContent.attr.style.background,
				textColorClasses = {
					'color': 'mapjs-node-light',
					'lightColor': 'mapjs-node-dark',
					'darkColor': 'mapjs-node-white'
				};
			if (fromStyle === 'false' || fromStyle === 'transparent') {
				fromStyle = false;
			}
			self.removeClass('mapjs-node-dark mapjs-node-white mapjs-node-light mapjs-node-colortext');
			self.css({'color': '', 'background-color': ''});
			if (fromStyle) {
				if (colorText) {
					self.css('color', fromStyle);
				} else {
					self.css('background-color', fromStyle);
					self.addClass(textColorClasses[MAPJS.foregroundStyle(fromStyle)]);
				}
			}
			if (colorText) {
				self.addClass('mapjs-node-colortext');
			}
		},
		setIcon = function (icon) {
			var textBox = textSpan(),
				textHeight,
				textWidth,
				maxTextWidth,
				padding,
				selfProps = {
					'min-height': '',
					'min-width': '',
					'background-image': '',
					'background-repeat': '',
					'background-size': '',
					'background-position': ''
				},
				textProps = {
					'margin-top': '',
					'margin-left': ''
				};
			self.css({padding: ''});
			if (icon) {
				padding = parseInt(self.css('padding-left'), 10);
				textHeight = textBox.outerHeight();
				textWidth = textBox.outerWidth();
				maxTextWidth = parseInt(textBox.css('max-width'), 10);
				_.extend(selfProps, {
					'background-image': 'url("' + (resourceTranslator ? resourceTranslator(icon.url) : icon.url) + '")',
					'background-repeat': 'no-repeat',
					'background-size': icon.width + 'px ' + icon.height + 'px',
					'background-position': 'center center'
				});
				if (icon.position === 'top' || icon.position === 'bottom') {
					if (icon.position === 'top') {
						selfProps['background-position'] = 'center ' + padding + 'px';
					} else if (MAPJS.DOMRender.fixedLayout) {
						selfProps['background-position'] = 'center ' + (padding + textHeight) + 'px';
					} else {
						selfProps['background-position'] = 'center ' + icon.position + ' ' + padding + 'px';
					}

					selfProps['padding-' + icon.position] = icon.height + (padding * 2);
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['margin-left'] =  Math.round((icon.width - maxTextWidth) / 2);
					}
				} else if (icon.position === 'left' || icon.position === 'right') {
					if (icon.position === 'left') {
						selfProps['background-position'] = padding + 'px center';
					} else if (MAPJS.DOMRender.fixedLayout) {
						selfProps['background-position'] = (textWidth + (2 * padding)) + 'px center ';
					} else {
						selfProps['background-position'] = icon.position + ' ' + padding + 'px center';
					}

					selfProps['padding-' + icon.position] = icon.width + (padding * 2);
					if (icon.height > textHeight) {
						textProps['margin-top'] =  Math.round((icon.height - textHeight) / 2);
						selfProps['min-height'] = icon.height;
					}
				} else {
					if (icon.height > textHeight) {
						textProps['margin-top'] =  Math.round((icon.height - textHeight) / 2);
						selfProps['min-height'] = icon.height;
					}
					selfProps['min-width'] = icon.width;
					if (icon.width > maxTextWidth) {
						textProps['margin-left'] =  Math.round((icon.width - maxTextWidth) / 2);
					}
				}
			}
			self.css(selfProps);
			textBox.css(textProps);
		},
		nodeLevel = forcedLevel || nodeContent.level,
		themeDefault =  function (a, b, c, d) {
			return d;
		},
		styleDefault = function () {
			return ['default'];
		},
		attrValue = (MAPJS.DOMRender.theme && MAPJS.DOMRender.theme.attributeValue) || themeDefault,
		nodeStyles = (MAPJS.DOMRender.theme &&  MAPJS.DOMRender.theme.nodeStyles) || styleDefault,
		effectiveStyles = nodeStyles(nodeLevel, nodeContent.attr),
		borderType = attrValue(['node'], effectiveStyles, ['border', 'type'], 'surround'),
		decorationEdge = attrValue(['node'], effectiveStyles, ['decorations', 'edge'], ''),
		decorationOverlap = attrValue(['node'], effectiveStyles, ['decorations', 'overlap'], ''),
		colorText = (borderType !== 'surround'),
		nodeCacheData, offset,
		isGroup = nodeContent.attr && nodeContent.attr.group;


	nodeCacheData = {
		x: Math.round(nodeContent.x),
		y: Math.round(nodeContent.y),
		width: Math.round(nodeContent.width),
		height: Math.round(nodeContent.height),
		nodeId: nodeContent.id,
		styles: effectiveStyles
	};

	nodeCacheData.innerRect = _.pick(nodeCacheData, ['width', 'height']);
	nodeCacheData.innerRect.dx = 0;
	nodeCacheData.innerRect.dy = 0;


	if (isGroup) {
		this.css({margin: '', width: nodeContent.width, height: nodeContent.height});
		updateText('');
	} else {
		updateText(nodeContent.title);
		applyLinkUrl(nodeContent.title);
		applyLabel(nodeContent.label);
		applyNote();
		applyAttachment();
		this.css({margin: '', width: '', height: ''});
		if (decorationEdge === 'left') {
			nodeCacheData.innerRect.dx = decorations().outerWidth();
			nodeCacheData.innerRect.width = nodeCacheData.width - decorations().outerWidth();
			self.css('margin-left', decorations().outerWidth());
		} else if (decorationEdge === 'right') {
			nodeCacheData.innerRect.width = nodeCacheData.width - decorations().outerWidth();
			self.css('margin-right', decorations().outerWidth());
		} else if (decorationEdge === 'top') {
			offset = (decorations().outerHeight() * (decorationOverlap ? 0.5 : 1));
			nodeCacheData.innerRect.dy = offset;
			nodeCacheData.innerRect.height = nodeCacheData.height - offset;
			if (offset) {
				self.css('margin-top', offset);
			}

		} else if (decorationEdge === 'bottom') {
			offset = decorations().outerHeight() * (decorationOverlap ? 0.5 : 1);
			nodeCacheData.innerRect.height = nodeCacheData.height - offset;
			self.css('margin-bottom', decorations().outerHeight() * (decorationOverlap ? 0.5 : 1));
		}
	}

	self.setThemeClassList(effectiveStyles).attr('mapjs-level', nodeLevel);

	self.data(nodeCacheData).addNodeCacheMark(nodeContent);
	setColors(colorText);
	setIcon(nodeContent.attr && nodeContent.attr.icon);
	setCollapseClass();
	self.trigger('mapjs:resize');
	return self;
};
jQuery.fn.placeCaretAtEnd = function () {
	'use strict';
	var el = this[0],
		range, sel, textRange;
	if (window.getSelection && document.createRange) {
		range = document.createRange();
		range.selectNodeContents(el);
		range.collapse(false);
		sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (document.body.createTextRange) {
		textRange = document.body.createTextRange();
		textRange.moveToElementText(el);
		textRange.collapse(false);
		textRange.select();
	}
};
jQuery.fn.selectAll = function () {
	'use strict';
	var el = this[0],
		range, sel, textRange;
	if (window.getSelection && document.createRange) {
		range = document.createRange();
		range.selectNodeContents(el);
		sel = window.getSelection();
		sel.removeAllRanges();
		sel.addRange(range);
	} else if (document.body.createTextRange) {
		textRange = document.body.createTextRange();
		textRange.moveToElementText(el);
		textRange.select();
	}
};
jQuery.fn.innerText = function () {
	'use strict';
	var htmlContent = this.html(),
			containsBr = /<br\/?>/.test(htmlContent),
			containsDiv = /<div>/.test(htmlContent);
	if (containsDiv && this[0].innerText) { /* broken safari jquery text */
		return this[0].innerText.trim();
	} else if (containsBr) { /*broken firefox innerText */
		return htmlContent.replace(/<br\/?>/gi, '\n').replace(/(<([^>]+)>)/gi, '');
	}
	return this.text();
};
jQuery.fn.editNode = function (shouldSelectAll) {
	'use strict';
	var node = this,
		textBox = this.find('[data-mapjs-role=title]'),
		unformattedText = this.data('title'),
		originalText = textBox.text(),
		result = jQuery.Deferred(),
		clear = function () {
			detachListeners();
			textBox.css('word-break', '');
			textBox.removeAttr('contenteditable');
			node.shadowDraggable();
		},
		finishEditing = function () {
			var content = textBox.innerText();
			if (content === unformattedText) {
				return cancelEditing();
			}
			clear();
			result.resolve(content);
		},
		cancelEditing = function () {
			clear();
			textBox.text(originalText);
			result.reject();
		},
		keyboardEvents = function (e) {
			var ENTER_KEY_CODE = 13,
				ESC_KEY_CODE = 27,
				TAB_KEY_CODE = 9,
				S_KEY_CODE = 83,
				Z_KEY_CODE = 90;
			if (e.shiftKey && e.which === ENTER_KEY_CODE) {
				return; // allow shift+enter to break lines
			} else if (e.which === ENTER_KEY_CODE) {
				finishEditing();
				e.stopPropagation();
			} else if (e.which === ESC_KEY_CODE) {
				cancelEditing();
				e.stopPropagation();
			} else if (e.which === TAB_KEY_CODE || (e.which === S_KEY_CODE && (e.metaKey || e.ctrlKey) && !e.altKey)) {
				finishEditing();
				e.preventDefault(); /* stop focus on another object */
			} else if (!e.shiftKey && e.which === Z_KEY_CODE && (e.metaKey || e.ctrlKey) && !e.altKey) { /* undo node edit on ctrl+z if text was not changed */
				if (textBox.text() === unformattedText) {
					cancelEditing();
				}
				e.stopPropagation();
			}
		},
		attachListeners = function () {
			textBox.on('blur', finishEditing).on('keydown', keyboardEvents);
		},
		detachListeners = function () {
			textBox.off('blur', finishEditing).off('keydown', keyboardEvents);
		};
	attachListeners();
	if (unformattedText !== originalText) { /* links or some other potential formatting issues */
		textBox.css('word-break', 'break-all');
	}
	textBox.text(unformattedText).attr('contenteditable', true).focus();
	if (shouldSelectAll) {
		textBox.selectAll();
	} else if (unformattedText) {
		textBox.placeCaretAtEnd();
	}
	node.shadowDraggable({disable: true});
	return result.promise();
};
jQuery.fn.updateReorderBounds = function (border, box, dropCoords) {
	'use strict';
	var element = this;
	if (!border) {
		element.hide();
		return;
	}
	element.show();
	element.attr('mapjs-edge', border.edge);
	if (border.edge === 'top') {
		element.css({
			top: border.minY,
			left: Math.round(dropCoords.x - element.width() / 2)
		});
	} else {
		element.css({
			top: Math.round(dropCoords.y - element.height() / 2),
			left: border.x - (border.edge === 'left' ? element.width() : 0)
		});
	}

};

(function () {
	'use strict';
	var cleanDOMId = function (s) {
			return s.replace(/[^A-Za-z0-9_-]/g, '_');
		},
		connectorKey = function (connectorObj) {
			return cleanDOMId('connector_' + connectorObj.from + '_' + connectorObj.to);
		},
		linkKey = function (linkObj) {
			return cleanDOMId('link_' + linkObj.ideaIdFrom + '_' + linkObj.ideaIdTo);
		},
		nodeKey = function (id) {
			return cleanDOMId('node_' + id);
		};

	jQuery.fn.createNode = function (node) {
		return jQuery('<div>')
			.attr({'id': nodeKey(node.id), 'tabindex': 0, 'data-mapjs-role': 'node' })
			.css({display: 'block', position: 'absolute'})
			.addClass('mapjs-node')
			.appendTo(this);
	};
	jQuery.fn.createConnector = function (connector) {
		return MAPJS.createSVG()
			.attr({'id': connectorKey(connector), 'data-mapjs-role': 'connector', 'class': 'mapjs-draw-container'})
			.data({'nodeFrom': this.nodeWithId(connector.from), 'nodeTo': this.nodeWithId(connector.to)})
			.appendTo(this);
	};
	jQuery.fn.createLink = function (l) {
		var defaults = _.extend({color: 'red', lineStyle: 'dashed'}, l.attr && l.attr.style);
		return MAPJS.createSVG()
			.attr({
				'id': linkKey(l),
				'data-mapjs-role': 'link',
				'class': 'mapjs-draw-container'
			})
			.data({'nodeFrom': this.nodeWithId(l.ideaIdFrom), 'nodeTo': this.nodeWithId(l.ideaIdTo) })
			.data(defaults)
			.appendTo(this);
	};
	jQuery.fn.nodeWithId = function (id) {
		return this.find('#' + nodeKey(id));
	};
	jQuery.fn.findConnector = function (connectorObj) {
		return this.find('#' + connectorKey(connectorObj));
	};
	jQuery.fn.findLink = function (linkObj) {
		return this.find('#' + linkKey(linkObj));
	};
	jQuery.fn.createReorderBounds = function () {
		var result = jQuery('<div>').attr({
			'data-mapjs-role': 'reorder-bounds',
			'class': 'mapjs-reorder-bounds'
		}).hide().css('position', 'absolute').appendTo(this);
		return result;
	};
})();

MAPJS.DOMRender.viewController = function (mapModel, stageElement, touchEnabled, imageInsertController, resourceTranslator, options) {
	'use strict';
	var viewPort = stageElement.parent(),
		connectorsForAnimation = jQuery(),
		linksForAnimation = jQuery(),
		nodeAnimOptions = { duration: 400, queue: 'nodeQueue', easing: 'linear' },
		reorderBounds = mapModel.isEditingEnabled() ? stageElement.createReorderBounds() : jQuery('<div>'),
		getViewPortDimensions = function () {
			if (viewPortDimensions) {
				return viewPortDimensions;
			}
			viewPortDimensions =  {
				left: viewPort.scrollLeft(),
				top: viewPort.scrollTop(),
				innerWidth: viewPort.innerWidth(),
				innerHeight: viewPort.innerHeight()
			};
			return viewPortDimensions;
		},
		stageToViewCoordinates = function (x, y) {
			var stage = stageElement.data(),
				scrollPosition = getViewPortDimensions();
			return {
				x: stage.scale * (x + stage.offsetX) - scrollPosition.left,
				y: stage.scale * (y + stage.offsetY) - scrollPosition.top
			};
		},
		viewToStageCoordinates = function (x, y) {
			var stage = stageElement.data(),
				scrollPosition = getViewPortDimensions();
			return {
				x: (scrollPosition.left + x) / stage.scale - stage.offsetX,
				y: (scrollPosition.top + y) / stage.scale - stage.offsetY
			};
		},
		updateScreenCoordinates = function () {
			var element = jQuery(this);
			element.css({
				'left': element.data('x'),
				'top' : element.data('y')
			}).trigger('mapjs:move');
		},
		animateToPositionCoordinates = function () {
			var element = jQuery(this);
			element.clearQueue(nodeAnimOptions.queue).animate({
				'left': element.data('x'),
				'top' : element.data('y'),
				'opacity': 1 /* previous animation can be cancelled with clearqueue, so ensure it gets visible */
			}, _.extend({
				complete: function () {
					element.css('opacity', '');
					element.each(updateScreenCoordinates);
				}
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
			return jQuery(this).each(function () {
				var node = jQuery(this).data(),
					margin = MAPJS.DOMRender.stageMargin || {top: 0, left: 0, bottom: 0, right: 0};
				/* sequence of calculations is important because maxX and maxY take into consideration the new offsetX snd offsetY */
				ensureSpaceForPoint(node.x - margin.left, node.y - margin.top);
				ensureSpaceForPoint(node.x + node.width + margin.right, node.y + node.height + margin.bottom);
			});
		},
		centerViewOn = function (x, y, animate) { /*in the stage coordinate system*/
			var stage = stageElement.data(),
				viewPortCenter = {
					x: Math.round(viewPort.innerWidth() / 2),
					y: Math.round(viewPort.innerHeight() / 2)
				},
				newLeftScroll, newTopScroll,
				margin = MAPJS.DOMRender.stageVisibilityMargin || {top: 0, left: 0, bottom: 0, right: 0};
			ensureSpaceForPoint(x - viewPortCenter.x / stage.scale, y - viewPortCenter.y / stage.scale);
			ensureSpaceForPoint(x + viewPortCenter.x / stage.scale - margin.left, y + viewPortCenter.y / stage.scale - margin.top);

			newLeftScroll = stage.scale * (x + stage.offsetX) - viewPortCenter.x;
			newTopScroll = stage.scale * (y + stage.offsetY) - viewPortCenter.y;
			viewPort.finish();
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
			return viewToStageCoordinates(Math.round(viewPort.innerWidth() / 2), Math.round(viewPort.innerHeight() / 2));
		},
		ensureNodeVisible = function (domElement) {
			var node, nodeTopLeft, nodeBottomRight, animation, margin;
			if (!domElement || domElement.length === 0) {
				return;
			}
			viewPort.finish();
			node = domElement.data();
			nodeTopLeft = stageToViewCoordinates(node.x, node.y);
			nodeBottomRight = stageToViewCoordinates(node.x + node.width, node.y + node.height);
			animation = {};
			margin = MAPJS.DOMRender.stageVisibilityMargin || {top: 10, left: 10, bottom: 10, right: 10};
			if ((nodeTopLeft.x - margin.left) < 0) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeTopLeft.x - margin.left;
			} else if ((nodeBottomRight.x + margin.right) > viewPort.innerWidth()) {
				animation.scrollLeft = viewPort.scrollLeft() + nodeBottomRight.x - viewPort.innerWidth() + margin.right;
			}
			if ((nodeTopLeft.y - margin.top) < 0) {
				animation.scrollTop = viewPort.scrollTop() + nodeTopLeft.y - margin.top;
			} else if ((nodeBottomRight.y + margin.bottom) > viewPort.innerHeight()) {
				animation.scrollTop = viewPort.scrollTop() + nodeBottomRight.y - viewPort.innerHeight() + margin.bottom;
			}
			if (!_.isEmpty(animation)) {
				viewPort.animate(animation, {duration: 100});
			}
		},
		viewportCoordinatesForPointEvent = function (evt) {
			var dropPosition = (evt && evt.gesture && evt.gesture.center) || evt,
				vpOffset = viewPort.offset(),
				result;
			if (dropPosition) {
				result = {
					x: dropPosition.pageX - vpOffset.left,
					y: dropPosition.pageY -  vpOffset.top
				};
				if (result.x >= 0 && result.x <= viewPort.innerWidth() && result.y >= 0 && result.y <= viewPort.innerHeight()) {
					return result;
				}
			}
		},
		stagePositionForPointEvent = function (evt) {
			var viewportDropCoordinates = viewportCoordinatesForPointEvent(evt);
			if (viewportDropCoordinates) {
				return viewToStageCoordinates(viewportDropCoordinates.x, viewportDropCoordinates.y);
			}
		},
		clearCurrentDroppable = function () {
			if (currentDroppable || currentDroppable === false) {
				jQuery('.mapjs-node').removeClass('droppable');
				currentDroppable = undefined;
			}
		},
		showDroppable = function (nodeId) {
			stageElement.nodeWithId(nodeId).addClass('droppable');
			currentDroppable = nodeId;
		},
		currentDroppable = false,
		viewPortDimensions,
		withinReorderBoundary = function (boundaries, box) {
			var closeTo = function (reorderBoundary) {
					var nodeX = box.x;
					if (reorderBoundary.edge === 'right') {
						nodeX += box.width;
					}
					if (reorderBoundary.x && reorderBoundary.margin) {
						return Math.abs(nodeX - reorderBoundary.x) < reorderBoundary.margin * 2 &&
							box.y < reorderBoundary.maxY &&
							box.y > reorderBoundary.minY;
					} else {
						return box.y < reorderBoundary.maxY &&
							box.y > reorderBoundary.minY &&
							box.x < reorderBoundary.maxX &&
							box.x > reorderBoundary.minX;
					}
				};
			if (_.isEmpty(boundaries)) {
				return false;
			}
			if (!box) {
				return false;
			}
			return _.find(boundaries, closeTo);
		};
	viewPort.on('scroll', function () {
		viewPortDimensions = undefined;
	});
	if (imageInsertController) {
		imageInsertController.addEventListener('imageInserted', function (dataUrl, imgWidth, imgHeight, evt) {
			var point = stagePositionForPointEvent(evt);
			mapModel.dropImage(dataUrl, imgWidth, imgHeight, point && point.x, point && point.y);
		});
	}
	mapModel.addEventListener('nodeCreated', function (node) {
		var currentReorderBoundary,
			element = stageElement.createNode(node)
			.queueFadeIn(nodeAnimOptions)
			.updateNodeContent(node, resourceTranslator)
			.nodeResizeWidget(node.id, mapModel, stagePositionForPointEvent)
			.on('tap', function (evt) {

				var realEvent = (evt.gesture && evt.gesture.srcEvent) || evt;
				if (realEvent.button && realEvent.button !== -1) {
					return;
				}
				mapModel.clickNode(node.id, realEvent);
				if (evt) {
					evt.stopPropagation();
				}
				if (evt && evt.gesture) {
					evt.gesture.stopPropagation();
				}

			})
			.on('doubletap', function (event) {
				if (event) {
					event.stopPropagation();
					if (event.gesture) {
						event.gesture.stopPropagation();
					}
				}
				if (!mapModel.isEditingEnabled()) {
					mapModel.toggleCollapse('mouse');
					return;
				}
				mapModel.editNode('mouse');
			})
			.on('attachment-click', function () {
				mapModel.openAttachment('mouse', node.id);
			})
			.on('decoration-click', function (evt, decorationType) {
				mapModel.decorationAction('mouse', node.id, decorationType);
			})
			.each(ensureSpaceForNode)
			.each(updateScreenCoordinates)
			.on('mm:start-dragging mm:start-dragging-shadow', function (evt) {
				if (evt && evt.relatedTarget === this) {
					mapModel.selectNode(node.id);
					currentReorderBoundary = mapModel.getReorderBoundary(node.id);
					element.addClass('dragging');
				}
			})
			.on('mm:drag', function (evt) {
				var dropCoords = stagePositionForPointEvent(evt),
					currentPosition = evt.currentPosition && stagePositionForPointEvent({pageX: evt.currentPosition.left, pageY: evt.currentPosition.top}),
					nodeId,
					hasShift = evt && evt.gesture && evt.gesture.srcEvent && evt.gesture.srcEvent.shiftKey,
					border;
				if (!dropCoords) {
					clearCurrentDroppable();
					return;
				}

				nodeId = mapModel.getNodeIdAtPosition(dropCoords.x, dropCoords.y);
				if (!hasShift && !nodeId && currentPosition) {
					currentPosition.width = element.outerWidth();
					currentPosition.height = element.outerHeight();
					border = withinReorderBoundary(currentReorderBoundary, currentPosition);
					reorderBounds.updateReorderBounds(border, currentPosition, dropCoords);
				} else {
					reorderBounds.hide();
				}
				if (!nodeId || nodeId === node.id) {
					clearCurrentDroppable();
				} else if (nodeId !== currentDroppable) {
					clearCurrentDroppable();
					if (nodeId) {
						showDroppable(nodeId);
					}
				}
			})
			.on('contextmenu', function (event) {
				mapModel.selectNode(node.id);
				if (mapModel.requestContextMenu(event.pageX, event.pageY)) {
					event.preventDefault();
					return false;
				}
			})
			.on('mm:stop-dragging', function (evt) {
				var isShift, stageDropCoordinates, nodeAtDrop, finalPosition, dropResult, manualPosition;
				element.removeClass('dragging');
				reorderBounds.hide();
				isShift = evt && evt.gesture && evt.gesture.srcEvent && evt.gesture.srcEvent.shiftKey;
				stageDropCoordinates = stagePositionForPointEvent(evt);
				clearCurrentDroppable();
				if (!stageDropCoordinates) {
					return;
				}
				nodeAtDrop = mapModel.getNodeIdAtPosition(stageDropCoordinates.x, stageDropCoordinates.y);
				finalPosition = stagePositionForPointEvent({pageX: evt.finalPosition.left, pageY: evt.finalPosition.top});
				if (nodeAtDrop && nodeAtDrop !== node.id) {
					dropResult = mapModel.dropNode(node.id, nodeAtDrop, !!isShift);
				} else {
					finalPosition.width = element.outerWidth();
					finalPosition.height = element.outerHeight();
					manualPosition = (!!isShift) || !withinReorderBoundary(currentReorderBoundary, finalPosition);
					if (manualPosition) {
						dropResult = mapModel.positionNodeAt(node.id, finalPosition.x, finalPosition.y, manualPosition);
					} else {
						dropResult = mapModel.positionNodeAt(node.id, stageDropCoordinates.x, stageDropCoordinates.y, manualPosition);
					}
				}
				return dropResult;
			})
			.on('mm:cancel-dragging', function () {
				clearCurrentDroppable();
				element.removeClass('dragging');
				reorderBounds.hide();
			}).on('mm:resize', function (event) {
				mapModel.setNodeWidth('mouse', node.id, event.nodeWidth);
			});
		if (touchEnabled) {
			element.on('hold', function (evt) {
				var realEvent = (evt.gesture && evt.gesture.srcEvent) || evt;
				mapModel.clickNode(node.id, realEvent);
				if (mapModel.requestContextMenu(evt.gesture.center.pageX, evt.gesture.center.pageY)) {
					evt.preventDefault();
					if (evt.gesture) {
						evt.gesture.preventDefault();
						evt.gesture.stopPropagation();
					}
					return false;
				}
			});
		}
		element.css('min-width', element.css('width'));
		if (mapModel.isEditingEnabled()) {
			element.shadowDraggable();
		}
	});
	mapModel.addEventListener('nodeSelectionChanged', function (ideaId, isSelected) {
		var node = stageElement.nodeWithId(ideaId);
		if (isSelected) {
			node.addClass('selected');
			ensureNodeVisible(node);
		} else {
			node.removeClass('selected');
		}
	});
	mapModel.addEventListener('nodeRemoved', function (node) {
		stageElement.nodeWithId(node.id).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('nodeMoved', function (node /*, reason*/) {
		var currentViewPortDimensions = getViewPortDimensions(),
			nodeDom = stageElement.nodeWithId(node.id).data({
				'x': Math.round(node.x),
				'y': Math.round(node.y),
				'width': Math.round(node.width),
				'height': Math.round(node.height)
			}).each(ensureSpaceForNode),
			screenTopLeft = stageToViewCoordinates(Math.round(node.x), Math.round(node.y)),
			screenBottomRight = stageToViewCoordinates(Math.round(node.x + node.width), Math.round(node.y + node.height));
		if (screenBottomRight.x < 0 || screenBottomRight.y < 0 || screenTopLeft.x > currentViewPortDimensions.innerWidth || screenTopLeft.y > currentViewPortDimensions.innerHeight) {
			nodeDom.each(updateScreenCoordinates);
		} else {
			nodeDom.each(animateToPositionCoordinates);
		}
	});
	mapModel.addEventListener('nodeTitleChanged nodeAttrChanged nodeLabelChanged', function (n) {
		stageElement.nodeWithId(n.id).updateNodeContent(n, resourceTranslator);
	});
	mapModel.addEventListener('connectorCreated', function (connector) {
		var element = stageElement.createConnector(connector).queueFadeIn(nodeAnimOptions).updateConnector(true);
		stageElement.nodeWithId(connector.from).add(stageElement.nodeWithId(connector.to))
			.on('mapjs:move', function () {
				element.updateConnector(true);
			})
			.on('mapjs:resize', function () {
				element.updateConnector(true);
			})
			.on('mm:drag', function () {
				element.updateConnector();
			})
			.on('mapjs:animatemove', function () {
				connectorsForAnimation = connectorsForAnimation.add(element);
			});
	});
	mapModel.addEventListener('connectorRemoved', function (connector) {
		stageElement.findConnector(connector).queueFadeOut(nodeAnimOptions);
	});
	mapModel.addEventListener('linkCreated', function (l) {
		var link = stageElement.createLink(l).queueFadeIn(nodeAnimOptions).updateLink();
		link.find('.mapjs-link-hit').on('tap', function (event) {
			mapModel.selectLink('mouse', l, { x: event.gesture.center.pageX, y: event.gesture.center.pageY });
			event.stopPropagation();
			event.gesture.stopPropagation();
		});
		stageElement.nodeWithId(l.ideaIdFrom).add(stageElement.nodeWithId(l.ideaIdTo))
			.on('mapjs:move mm:drag', function () {
				link.updateLink();
			})
			.on('mapjs:animatemove', function () {
				linksForAnimation = linksForAnimation.add(link);
			});

	});
	mapModel.addEventListener('linkRemoved', function (l) {
		stageElement.findLink(l).queueFadeOut(nodeAnimOptions);
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
	mapModel.addEventListener('nodeVisibilityRequested', function (ideaId) {
		var id = ideaId || mapModel.getCurrentlySelectedIdeaId(),
				node = stageElement.nodeWithId(id);
		if (node) {
			ensureNodeVisible(node);
			viewPort.finish();
		}

	});
	mapModel.addEventListener('nodeFocusRequested', function (ideaId) {
		var node = stageElement.nodeWithId(ideaId).data(),
			nodeCenterX = Math.round(node.x + node.width / 2),
			nodeCenterY = Math.round(node.y + node.height / 2);
		if (stageElement.data('scale') !== 1) {
			stageElement.data('scale', 1).updateStage();
		}
		centerViewOn(nodeCenterX, nodeCenterY, true);
	});
	mapModel.addEventListener('mapViewResetRequested', function () {
		stageElement.data({'scale': 1, 'height': 0, 'width': 0, 'offsetX': 0, 'offsetY': 0}).updateStage();
		stageElement.children().andSelf().finish(nodeAnimOptions.queue);
		jQuery(stageElement).find('.mapjs-node').each(ensureSpaceForNode);
		jQuery(stageElement).find('[data-mapjs-role=connector]').updateConnector(true);
		jQuery(stageElement).find('[data-mapjs-role=link]').updateLink(true);
		centerViewOn(0, 0);
		viewPort.focus();
	});
	mapModel.addEventListener('layoutChangeStarting', function () {
		viewPortDimensions = undefined;
		stageElement.children().finish(nodeAnimOptions.queue);
		stageElement.finish(nodeAnimOptions.queue);
	});
	mapModel.addEventListener('layoutChangeComplete', function (options) {
		var connectorGroupClone = jQuery(), linkGroupClone = jQuery();
		if (options && options.themeChanged) {
			stageElement.children().andSelf().finish(nodeAnimOptions.queue);
			jQuery(stageElement).find('[data-mapjs-role=connector]').updateConnector(true);
			jQuery(stageElement).find('[data-mapjs-role=link]').updateLink(true);
		} else {
			connectorsForAnimation.each(function () {
				if (!jQuery(this).animateConnectorToPosition(nodeAnimOptions, 2)) {
					connectorGroupClone = connectorGroupClone.add(this);
				}
			});
			linksForAnimation.each(function () {
				if (!jQuery(this).animateConnectorToPosition(nodeAnimOptions, 2)) {
					linkGroupClone = linkGroupClone.add(this);
				}
			});
			stageElement.animate({'opacity': 1}, _.extend({
				progress: function () {
					connectorGroupClone.updateConnector();
					linkGroupClone.updateLink();
				},
				complete: function () {
					connectorGroupClone.updateConnector(true);
					linkGroupClone.updateLink(true);
				}
			}, nodeAnimOptions));
			stageElement.children().dequeue(nodeAnimOptions.queue);
			stageElement.dequeue(nodeAnimOptions.queue);
		}
		connectorsForAnimation = jQuery();
		linksForAnimation = jQuery();

		ensureNodeVisible(stageElement.nodeWithId(mapModel.getCurrentlySelectedIdeaId()));
	});

	/* editing */
	if (!options || !options.inlineEditingDisabled) {
		mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
			var editingElement = stageElement.nodeWithId(nodeId);
			mapModel.setInputEnabled(false);
			viewPort.finish(); /* close any pending animations */
			editingElement.editNode(shouldSelectAll).done(
				function (newText) {
					mapModel.setInputEnabled(true);
					mapModel.updateTitle(nodeId, newText, editingNew);
					editingElement.focus();

				}).fail(function () {
					mapModel.setInputEnabled(true);
					if (editingNew) {
						mapModel.undo('internal');
					}
					editingElement.focus();
				});
		});
	}
	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
		if (isOn) {
			stageElement.addClass('mapjs-add-link');
		} else {
			stageElement.removeClass('mapjs-add-link');
		}
	});
	mapModel.addEventListener('linkAttrChanged', function (l) {
		var  attr = _.extend({arrow: false}, l.attr && l.attr.style);
		stageElement.findLink(l).data(attr).updateLink();
	});

	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {
		_.each(activatedNodes, function (nodeId) {
			stageElement.nodeWithId(nodeId).addClass('activated');
		});
		_.each(deactivatedNodes, function (nodeId) {
			stageElement.nodeWithId(nodeId).removeClass('activated');
		});
	});
};


/*jslint nomen: true, newcap: true, browser: true*/
/*global MAPJS, $, _, jQuery*/

jQuery.fn.scrollWhenDragging = function (scrollPredicate) {
	/*jslint newcap:true*/
	'use strict';
	return this.each(function () {
		var element = $(this),
			dragOrigin;
		element.on('dragstart', function () {
			if (scrollPredicate()) {
				dragOrigin = {
					top: element.scrollTop(),
					left: element.scrollLeft()
				};
			}
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
$.fn.domMapWidget = function (activityLog, mapModel, touchEnabled, imageInsertController, dragContainer, resourceTranslator, centerSelectedNodeOnOrientationChange, options) {
	'use strict';
	var hotkeyEventHandlers = {
			'return': 'insertDown',
			'shift+return': 'insertUp',
			'shift+tab': 'insertLeft',
			'tab insert': 'insertRight',
			'del backspace': 'removeSubIdea',
			'left': 'selectNodeLeft',
			'up': 'selectNodeUp',
			'right': 'selectNodeRight',
			'shift+right': 'activateNodeRight',
			'shift+left': 'activateNodeLeft',
			'meta+right ctrl+right': 'moveRight',
			'meta+left ctrl+left': 'moveLeft',
			'meta+up ctrl+up': 'moveUp',
			'meta+down ctrl+down': 'moveDown',
			'shift+up': 'activateNodeUp',
			'shift+down': 'activateNodeDown',
			'down': 'selectNodeDown',
			'space f2': 'editNode',
			'f': 'toggleCollapse',
			'c meta+x ctrl+x': 'cut',
			'p meta+v ctrl+v': 'paste',
			'y meta+c ctrl+c': 'copy',
			'u meta+z ctrl+z': 'undo',
			'Esc 0 meta+0 ctrl+0': 'resetView',
			'r meta+shift+z ctrl+shift+z meta+y ctrl+y': 'redo',
			'meta+plus ctrl+plus z': 'scaleUp',
			'meta+minus ctrl+minus shift+z': 'scaleDown',
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
		actOnKeys = true,
		self = this;
	mapModel.addEventListener('inputEnabledChanged', function (canInput, holdFocus) {
		actOnKeys = canInput;
		if (canInput && !holdFocus) {
			self.focus();
		}
	});

	return this.each(function () {
		var element = $(this),
			stage = $('<div>').css({
				position: 'relative'
			}).attr('data-mapjs-role', 'stage').appendTo(element).data({
				'offsetX': element.innerWidth() / 2,
				'offsetY': element.innerHeight() / 2,
				'width': element.innerWidth() - 20,
				'height': element.innerHeight() - 20,
				'scale': 1
			}).updateStage(),
			previousPinchScale = false;
		element.css('overflow', 'auto').attr('tabindex', 1);
		if (mapModel.isEditingEnabled()) {
			(dragContainer || element).simpleDraggableContainer();
		}

		if (!touchEnabled) {
			element.scrollWhenDragging(mapModel.getInputEnabled); //no need to do this for touch, this is native
			element.on('mousedown', function (e) {
				if (e.target !== element[0]) {
					element.css('overflow', 'hidden');
				}
			});
			jQuery(document).on('mouseup', function () {
				if (element.css('overflow') !== 'auto') {
					element.css('overflow', 'auto');
				}
			});
			element.imageDropWidget(imageInsertController);
		} else {
			element.on('doubletap', function (event) {
				if (mapModel.requestContextMenu(event.gesture.center.pageX, event.gesture.center.pageY)) {
					event.preventDefault();
					event.gesture.preventDefault();
					return false;
				}
			}).on('pinch', function (event) {
				if (!event || !event.gesture || !event.gesture.scale) {
					return;
				}
				event.preventDefault();
				event.gesture.preventDefault();

				var scale = event.gesture.scale;
				if (previousPinchScale) {
					scale = scale / previousPinchScale;
				}
				if (Math.abs(scale - 1) < 0.05) {
					return;
				}
				previousPinchScale = event.gesture.scale;

				mapModel.scale('touch', scale, {
					x: event.gesture.center.pageX - stage.data('offsetX'),
					y: event.gesture.center.pageY - stage.data('offsetY')
				});
			}).on('gestureend', function () {
				previousPinchScale = false;
			});

		}
		MAPJS.DOMRender.viewController(mapModel, stage, touchEnabled, imageInsertController, resourceTranslator, options);
		_.each(hotkeyEventHandlers, function (mappedFunction, keysPressed) {
			element.keydown(keysPressed, function (event) {
				if (actOnKeys) {
					event.stopImmediatePropagation();
					event.preventDefault();
					mapModel[mappedFunction]('keyboard');
				}
			});
		});
		if (!touchEnabled) {
			jQuery(window).on('resize', function () {
				mapModel.resetView();
			});
		}

		jQuery(window).on('orientationchange', function () {
			if (centerSelectedNodeOnOrientationChange) {
				mapModel.centerOnNode(mapModel.getSelectedNodeId());
			} else {
				mapModel.resetView();
			}

		});
		jQuery(document).on('keydown', function (e) {
			var functions = {
				'U+003D': 'scaleUp',
				'U+002D': 'scaleDown',
				61: 'scaleUp',
				173: 'scaleDown'
			}, mappedFunction;
			if (e && !e.altKey && (e.ctrlKey || e.metaKey)) {
				if (e.originalEvent && e.originalEvent.keyIdentifier) { /* webkit */
					mappedFunction = functions[e.originalEvent.keyIdentifier];
				} else if (e.key === 'MozPrintableKey') {
					mappedFunction = functions[e.which];
				}
				if (mappedFunction) {
					if (actOnKeys) {
						e.preventDefault();
						mapModel[mappedFunction]('keyboard');
					}
				}
			}
		}).on('wheel mousewheel', function (e) {
			var scroll = e.originalEvent.deltaX || (-1 * e.originalEvent.wheelDeltaX);
			if (scroll < 0 && element.scrollLeft() === 0) {
				e.preventDefault();
			}
			if (scroll > 0 && (element[0].scrollWidth - element.width() - element.scrollLeft() === 0)) {
				e.preventDefault();
			}
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

/*global $, MAPJS*/
$.fn.themeCssWidget = function (themeProvider, themeProcessor, mapModel) {
	'use strict';
	var element = $(this),
		activateTheme =	function (theme) {
			var themeJson = themeProvider[(theme || 'default')];
			if (!themeJson) {
				return;
			}
			MAPJS.DOMRender.theme = new MAPJS.Theme(themeJson);
			element.text(themeProcessor.process(themeJson).css);
		};
	activateTheme('default');
	mapModel.addEventListener('themeChanged', activateTheme);
	return element;
};


/*global jQuery*/
jQuery.fn.nodeResizeWidget = function (nodeId, mapModel, stagePositionForPointEvent) {
	'use strict';
	return this.each(function () {
		var element = jQuery(this),
			nodeTextElement = element.find('span[data-mapjs-role=title]'),
			nodeTextDOM = nodeTextElement[0],
			initialPosition,
			initialWidth,
			minAllowedWidth = 50,
			initialStyle,
			calcDragWidth = function (evt) {
				var pos = stagePositionForPointEvent(evt),
					dx = pos && initialPosition && (pos.x - initialPosition.x),
					dragWidth = dx && Math.max(minAllowedWidth, (initialWidth + dx));
				return dragWidth;
			},
			dragHandle = jQuery('<div>').addClass('resize-node').shadowDraggable().on('mm:start-dragging mm:start-dragging-shadow', function (evt) {
				mapModel.selectNode(nodeId);
				initialPosition = stagePositionForPointEvent(evt);
				initialWidth = nodeTextElement.innerWidth();
				initialStyle = {
					'node.min-width': element.css('min-width'),
					'span.min-width': nodeTextElement.css('min-width'),
					'span.max-width': nodeTextElement.css('max-width')
				};
			}).on('mm:stop-dragging mm:cancel-dragging', function (evt) {
				var dragWidth = nodeTextElement.outerWidth();
				nodeTextElement.css({'max-width': initialStyle['span.max-width'], 'min-width': initialStyle['span.min-width']});
				element.css('min-width', initialStyle['node.min-width']);
				if (evt) {
					evt.stopPropagation();
				}
				if (evt && evt.gesture) {
					evt.gesture.stopPropagation();
				}
				element.trigger(jQuery.Event('mm:resize', {nodeWidth: dragWidth}));
			}).on('mm:drag', function (evt) {
				var dragWidth = calcDragWidth(evt);
				if (dragWidth) {
					nodeTextElement.css({'max-width': dragWidth, 'min-width': dragWidth});
					element.css('min-width', nodeTextElement.outerWidth());
					if (nodeTextDOM.scrollWidth > nodeTextDOM.offsetWidth) {
						dragWidth = nodeTextDOM.scrollWidth;
						nodeTextElement.css({'max-width': dragWidth, 'min-width': dragWidth});
						element.css('min-width', nodeTextElement.outerWidth());
					}
				}
				if (evt) {
					evt.stopPropagation();
				}
				if (evt && evt.gesture) {
					evt.gesture.stopPropagation();
				}
			});
		dragHandle.appendTo(element);
	});
};
