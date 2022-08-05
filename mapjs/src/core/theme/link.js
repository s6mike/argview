/*global require, module */
const Theme = require ('./theme'),
	arrowPath = function (lineFrom, lineTo, offset) {
		'use strict';
		const n = Math.tan(Math.PI / 9),
			dx = lineTo.x - lineFrom.x,
			dy = lineTo.y - lineFrom.y;

		let len = 14, iy, a1x, a2x, a1y, a2y, m;

		if (dx === 0) {
			iy = dy < 0 ? -1 : 1;
			a1x = lineTo.x + len * Math.sin(n) * iy;
			a2x = lineTo.x - len * Math.sin(n) * iy;
			a1y = lineTo.y - len * Math.cos(n) * iy;
			a2y = lineTo.y - len * Math.cos(n) * iy;
		} else {
			m = dy / dx;
			if (lineFrom.x < lineTo.x) {
				len = -len;
			}
			a1x = lineTo.x + (1 - m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
			a1y = lineTo.y + (m + n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
			a2x = lineTo.x + (1 + m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
			a2y = lineTo.y + (m - n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
		}
		return 'M' + Math.round(a1x - offset.left) + ',' + Math.round(a1y - offset.top) +
			'L' + Math.round(lineTo.x - offset.left) + ',' + Math.round(lineTo.y - offset.top) +
			'L' + Math.round(a2x - offset.left) + ',' + Math.round(a2y - offset.top) +
			'Z';
	},
	lineStyles = require('./line-styles'),
	linkPath = function (parent, child, linkAttrArg, themeArg) {
		'use strict';
		const calculateConnector = function (parent, child) {
				const parentPoints =
					[
						{
							x: parent.left + Math.round(0.5 * parent.width),
							y: parent.top
						},
						{
							x: parent.left + parent.width,
							y: parent.top + Math.round(0.5 * parent.height)
						},
						{
							x: parent.left + Math.round(0.5 * parent.width),
							y: parent.top + parent.height
						},
						{
							x: parent.left,
							y: parent.top + Math.round(0.5 * parent.height)
						}
					],
					childPoints =
					[
						{
							x: child.left + Math.round(0.5 * child.width),
							y: child.top
						},
						{
							x: child.left + child.width,
							y: child.top + Math.round(0.5 * child.height)
						},
						{
							x: child.left + Math.round(0.5 * child.width),
							y: child.top + child.height
						},
						{
							x: child.left,
							y: child.top + Math.round(0.5 * child.height)
						}
					];
				let i, j, min = Infinity, bestParent, bestChild, dx, dy, current;
				for (i = 0; i < parentPoints.length; i += 1) {
					for (j = 0; j < childPoints.length; j += 1) {
						dx = parentPoints[i].x - childPoints[j].x;
						dy = parentPoints[i].y - childPoints[j].y;
						current = dx * dx + dy * dy;
						if (current < min) {
							bestParent = i;
							bestChild = j;
							min = current;
						}
					}
				}
				return {
					from: parentPoints[bestParent],
					to: childPoints[bestChild]
				};
			},
			conn = calculateConnector(parent, child),
			theme = themeArg || new Theme({}),
			linkAttr = linkAttrArg || {},
			left = Math.min(parent.left, child.left),
			top = Math.min(parent.top, child.top),
			position = {
				left: left,
				top: top,
				width: Math.max(parent.left + parent.width, child.left + child.width, left) - left,
				height: Math.max(parent.top + parent.height, child.top + child.height, top) - top
			},
			arrowPaths = function (arrowAttr) {
				//arrowAttr = true, to, from, both
				if (!arrowAttr) {
					return false;
				}
				const paths = [];
				if (arrowAttr !== 'from') {
					paths.push(arrowPath(conn.from, conn.to, position));
				}
				if (arrowAttr === 'from' || arrowAttr === 'both') {
					paths.push(arrowPath(conn.to, conn.from, position));
				}
				return paths;
			},
			linkTheme = theme.linkTheme(linkAttr.type),
			width = linkAttr.width || linkTheme.line.width,
			lineStyle = linkAttr.lineStyle || linkTheme.line.lineStyle,
			lineProps = {
				color: linkAttr.color || linkTheme.line.color,
				strokes: lineStyles.strokes(lineStyle, width),
				linecap: lineStyles.linecap(lineStyle, width),
				width: width
			};


		return {
			d: 'M' + Math.round(conn.from.x - position.left) + ',' + Math.round(conn.from.y - position.top) + 'L' + Math.round(conn.to.x - position.left) + ',' + Math.round(conn.to.y - position.top),
			position: position,
			arrows: (linkAttr.arrow && linkAttr.arrow !== 'false') && arrowPaths(linkAttr.arrow),
			theme: linkTheme,
			lineProps: lineProps,
			label: linkAttr.label
		};
	};

module.exports = linkPath;
