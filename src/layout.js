/*jslint nomen: true*/
/*global _, Color, MAPJS*/
(function () {
	'use strict';
	MAPJS.calculateDimensions = function calculateDimensions(idea, dimensionProvider, margin) {
		var dimensions = dimensionProvider(idea.title),
			result = _.extend(_.pick(idea, ['id', 'title', 'attr']), {
				width: dimensions.width + 2 * margin,
				height: dimensions.height + 2 * margin
			}),
			leftOrRight,
			subIdeaWidths = [0, 0],
			subIdeaHeights = [0, 0],
			subIdeaRank,
			subIdea,
			subIdeaDimensions;
		if (idea.ideas && !idea.getAttr('collapsed')) {
			result.ideas = {};
			for (subIdeaRank in idea.ideas) {
				subIdea = idea.ideas[subIdeaRank];
				subIdeaDimensions = calculateDimensions(subIdea, dimensionProvider, margin);
				result.ideas[subIdeaRank] = subIdeaDimensions;
				leftOrRight = subIdeaRank > 0 ? 1 : 0;
				subIdeaWidths[leftOrRight] = Math.max(subIdeaWidths[leftOrRight], subIdeaDimensions.Width);
				subIdeaHeights[leftOrRight] += subIdeaDimensions.Height;
			}
		}
		result.WidthLeft = subIdeaWidths[0] || 0;
		result.Width = result.width + subIdeaWidths[0] + subIdeaWidths[1];
		result.Height = Math.max(result.height, subIdeaHeights[0], subIdeaHeights[1]);
		return result;
	};
	MAPJS.calculatePositions = function calculatePositions(idea, dimensionProvider, margin, x0, y0, result, isLeftSubtree) {
		var ranks,
			subIdeaRank,
			i,
			subIdeaDimensions,
			leftOrRight,
			totalHeights = [0, 0],
			subIdeaCurrentY0 = [y0, y0];
		result = result || MAPJS.calculateDimensions(idea, dimensionProvider, margin);
		x0 += result.WidthLeft;
		result.x = x0 + margin;
		result.y = y0 + 0.5 * (result.Height - result.height) + margin;
		if (result.ideas) {
			ranks = [];
			for (subIdeaRank in result.ideas) {
				ranks.push(parseFloat(subIdeaRank));
				subIdeaDimensions = result.ideas[subIdeaRank];
				if (isLeftSubtree) {
					subIdeaRank = -subIdeaRank;
				}
				totalHeights[subIdeaRank < 0 ? 0 : 1] += subIdeaDimensions.Height;
			}
			subIdeaCurrentY0[0] += 0.5 * (result.Height - totalHeights[0]);
			subIdeaCurrentY0[1] += 0.5 * (result.Height - totalHeights[1]);
			ranks.sort(function ascending(firstRank, secondRank) {
				if (firstRank >= 0 && secondRank >= 0) {
					return secondRank - firstRank;
				}
				if (firstRank < 0 && secondRank < 0) {
					return firstRank - secondRank;
				}
				return secondRank - firstRank;
			});
			for (i = ranks.length - 1; i >= 0; i -= 1) {
				subIdeaRank = ranks[i];
				subIdeaDimensions = result.ideas[subIdeaRank];
				if (isLeftSubtree) {
					subIdeaRank = -subIdeaRank;
				}
				leftOrRight = subIdeaRank > 0 ? 1 : 0;
				calculatePositions(undefined, dimensionProvider, margin, x0 + (leftOrRight ? result.width : -subIdeaDimensions.width), subIdeaCurrentY0[leftOrRight], subIdeaDimensions, isLeftSubtree || leftOrRight === 0);
				subIdeaCurrentY0[leftOrRight] += subIdeaDimensions.Height;
			}
		}
		return result;
	};
	MAPJS.defaultStyles = {
		root: {background: '#22AAE0'},
		nonRoot: {background: '#E0E0E0'}
	};

	MAPJS.calculateLayout = function (idea, dimensionProvider, margin) {
		margin = margin || 10;
		var result = {
			nodes: {},
			connectors: {},
			links: {}
		},
			root = MAPJS.calculatePositions(idea, dimensionProvider, margin, 0, 0),
			calculateLayoutInner = function (positions, level) {
				var subIdeaRank, from, to, isRoot = level === 1,
					defaultStyle = MAPJS.defaultStyles[isRoot ? 'root' : 'nonRoot'],
					node = _.extend(_.pick(positions, ['id', 'width', 'height', 'title', 'attr']), {
						x: positions.x - root.x - 0.5 * root.width + margin,
						y: positions.y - root.y - 0.5 * root.height + margin,
						level: level
					});
				node.attr = node.attr || {};
				node.attr.style = _.extend({}, defaultStyle, node.attr.style);
				result.nodes[positions.id] = node;
				if (positions.ideas) {
					for (subIdeaRank in positions.ideas) {
						calculateLayoutInner(positions.ideas[subIdeaRank], level + 1);
						from = positions.id;
						to = positions.ideas[subIdeaRank].id;
						result.connectors[to] = {
							from: from,
							to: to
						};
					}
				}
			};
		MAPJS.LayoutCompressor.compress(root);
		calculateLayoutInner(root, 1);
		_.each(idea.links, function (link) {
			if (result.nodes[link.ideaIdFrom] && result.nodes[link.ideaIdTo]) {
				result.links[link.ideaIdFrom + '_' + link.ideaIdTo] = {
					ideaIdFrom: link.ideaIdFrom,
					ideaIdTo: link.ideaIdTo,
					attr: _.clone(link.attr)
				};
				//todo - clone
			}
		});
		return result;
	};
	MAPJS.calculateFrame = function (nodes, margin) {
		margin = margin || 0;
		var result = {
			top: _.min(nodes, function (node) {return node.y; }).y - margin,
			left: _.min(nodes, function (node) {return node.x; }).x - margin
		};
		result.width = margin + _.max(_.map(nodes, function (node) { return node.x + node.width; })) - result.left;
		result.height = margin + _.max(_.map(nodes, function (node) { return node.y + node.height; })) - result.top;
		return result;
	};
	MAPJS.contrastForeground = function (background) {
		/*jslint newcap:true*/
		var luminosity = Color(background).luminosity();
		if (luminosity < 0.5) {
			return '#EEEEEE';
		}
		if (luminosity < 0.9) {
			return '#4F4F4F';
		}
		return '#000000';
	};
}());
MAPJS.Outline = function (topBorder, bottomBorder) {
	var shiftBorder = function (border, deltaH) {
		return _.map (border, function (segment) {
			return { 
				l: segment.l,
				h: segment.h + deltaH
			}
		});
	}
	this.initialHeight = function () {
		return this.bottom[0].h - this.top[0].h;
	}
	this.extend = function (dl) {
		this.top[0].l += dl;
		this.bottom[0].l += dl;
		return this;
	};
	this.borders = function () {
		return _.pick(this, 'top', 'bottom');
	};
	this.spacingAbove = function (outline) {
		var i = 0, j = 0, result = 0, li = 0, lj = 0;
		while (i < this.bottom.length && j < outline.top.length) {
			result = Math.max(result, this.bottom[i].h - outline.top[j].h);
			if (li + this.bottom[i].l < lj + outline.top[j].l) {				
				li += this.bottom[i].l; i++;
			} else if (li + this.bottom[i].l === lj + outline.top[j].l) {				
				li += this.bottom[i].l; i++;				
				lj += outline.top[j].l; j++;
			} else {				
				lj += outline.top[j].l; j++;
			}
		}
		return result;
	};
	this.stackBelow = function (outline, margin) {
		var spacing = outline.spacingAbove(this);
		console.log(JSON.stringify(outline), JSON.stringify(this), spacing);
		var top = MAPJS.Outline.extendBorder(outline.top, shiftBorder(this.top, spacing + margin));
		var bottom = MAPJS.Outline.extendBorder(shiftBorder(this.bottom, spacing + margin), outline.bottom);
		return new MAPJS.Outline(
			top,
			bottom
		);
	};
	this.stackLeft = function (outline, margin) {
			var suboutlineHeight = outline.initialHeight(),
				alignment = - outline.top[0].h - suboutlineHeight * 0.5;
			outline.extend(margin);
			return new MAPJS.Outline(this.top.concat(shiftBorder(outline.top, alignment)), this.bottom.concat(shiftBorder(outline.bottom, alignment)));
	}
	this.top = topBorder.slice();
	this.bottom = bottomBorder.slice();
};
MAPJS.Outline.borderLength = function (border) {
	return _.reduce(border, function (seed, el) {
		return seed + el.l;
	}, 0);
};
MAPJS.Outline.borderSegmentIndexAt = function (border, length) {
	var l = 0, i = -1;
	while (l <= length) {		
		i++;
		if (i>=border.length) {
			return -1;
		}
		l += border[i].l;
	}
	return i;
};
MAPJS.Outline.extendBorder = function (originalBorder, extension) {
	var result = originalBorder.slice(),
		origLength = MAPJS.Outline.borderLength(originalBorder),
		i = MAPJS.Outline.borderSegmentIndexAt(extension, origLength),
		lengthToCut;
	if (i >= 0) {
		lengthToCut = MAPJS.Outline.borderLength (extension.slice(0, i + 1));
		result.push({h:extension[i].h, l: lengthToCut - origLength});
		result = result.concat(extension.slice(i + 1));
	}
	return result;
};
MAPJS.Tree = function (options) {
	_.extend(this, options);
	this.toLayout = function (level, x, y, parentId) {
		x = x || 0;
		y = y || 0;
		var result = {
			nodes: {},
			links: {},
			connectors: {}
		}, self;
		self = _.pick(this, 'id', 'title', 'attr');
		self.level = level || 1;
		if (self.level === 1) {
			self.x = -0.5 * this.width;
			self.y = -0.5 * this.height;
		} else {
			self.x = x + this.deltaX || 0,
			self.y = y + this.deltaY || 0
		}
		result.nodes[this.id] = self;
		if (parentId !== undefined) {
			result.connectors[self.id] = {
				from: parentId,
				to: self.id
			};
		}
		if (this.subtrees) {
			this.subtrees.forEach(function (t) {
				var subLayout = t.toLayout(self.level + 1, self.x, self.y, self.id);
				_.extend(result.nodes, subLayout.nodes);
				_.extend(result.connectors, subLayout.connectors);
			});
		} 
		return result;
	};
};
MAPJS.Outline.fromDimensions = function (dimensions) {
	return new MAPJS.Outline([{
					h: -0.5 * dimensions.height,
					l: dimensions.width
				}], [{
					h: 0.5 * dimensions.height,
					l: dimensions.width
				}]
	);
};
MAPJS.calculateTree = function (content, dimensionProvider, margin) {
	var options = {
		id: content.id,
		title: content.title,
		attr: content.attr,
		deltaY: 0,
		deltaX: 0
	}, 
	moveTrees = function (treeArray, dx, dy) {
		var i;
		for (i = 0; i< treeArray.length; i++ ){ 
			treeArray[i].deltaX += dx; 
			treeArray[i].deltaY += dy; 
		}	
	}, subideas = content.sortedSubIdeas();
	_.extend(options, dimensionProvider(content));
	options.outline = new MAPJS.Outline.fromDimensions(options);
	if (!_.isEmpty(subideas)) {
		options.subtrees = _.map(subideas, function (i) {
			return MAPJS.calculateTree(i, dimensionProvider, margin);
		});
		var suboutline = options.subtrees[0].outline;
		for (i = 1; i< options.subtrees.length; i++ ){ 
			suboutline=options.subtrees[i].outline.stackBelow(suboutline, margin);
			options.subtrees[i].deltaY = suboutline.initialHeight() - options.subtrees[i].height;		
		}
		moveTrees(options.subtrees, options.width + margin, 0.5 * (options.height  - suboutline.initialHeight()));
		options.outline = options.outline.stackLeft(suboutline, margin);
	}
	return new MAPJS.Tree(options);
};

MAPJS.calculateLayout = function (idea, dimensionProvider, margin) {
	var tree = MAPJS.calculateTree(idea, function (idea) { 
		var result = dimensionProvider(idea.title); 
		console.log(idea.title, JSON.stringify(result));
		return result;
	}, margin || 10);
	return tree.toLayout();
};
/**/