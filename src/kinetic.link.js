/*global _, Kinetic*/
/*jslint nomen: true*/
(function () {
	'use strict';
	Kinetic.Link = function (config) {
		this.shapeFrom = config.shapeFrom;
		this.shapeTo = config.shapeTo;
		this.shapeType = 'Link';
		Kinetic.Shape.call(this, config);
		this._setDrawFuncs();
	};
	var calculateConnectorInner = _.memoize(
		function (parentX, parentY, parentWidth, parentHeight, childX, childY, childWidth, childHeight) {
			var parent = [
				{
					x: parentX + 0.5 * parentWidth,
					y: parentY
				},
				{
					x: parentX + parentWidth,
					y: parentY + 0.5 * parentHeight
				},
				{
					x: parentX + 0.5 * parentWidth,
					y: parentY + parentHeight
				},
				{
					x: parentX,
					y: parentY + 0.5 * parentHeight
				}
			], child = [
				{
					x: childX + 0.5 * childWidth,
					y: childY
				},
				{
					x: childX + childWidth,
					y: childY + 0.5 * childHeight
				},
				{
					x: childX + 0.5 * childWidth,
					y: childY + childHeight
				},
				{
					x: childX,
					y: childY + 0.5 * childHeight
				}
			], i, j, min = Infinity, bestParent, bestChild, dx, dy, current;
			for (i = 0; i < parent.length; i += 1) {
				for (j = 0; j < child.length; j += 1) {
					dx = parent[i].x - child[j].x;
					dy = parent[i].y - child[j].y;
					current = dx * dx + dy * dy;
					if (current < min) {
						bestParent = i;
						bestChild = j;
						min = current;
					}
				}
			}
			return {
				from: parent[bestParent],
				to: child[bestChild]
			};
		},
		function () {
			return Array.prototype.join.call(arguments, ',');
		}
	),
		calculateConnector = function (parent, child) {
			return calculateConnectorInner(parent.attrs.x, parent.attrs.y, parent.getWidth(), parent.getHeight(),
				child.attrs.x, child.attrs.y, child.getWidth(), child.getHeight());
		};
	Kinetic.Link.prototype = {
		drawFunc: function (canvas) {
			var context = canvas.getContext(),
				shapeFrom = this.shapeFrom,
				shapeTo = this.shapeTo,
				conn;
			conn = calculateConnector(shapeFrom, shapeTo);
			context.fillStyle = this.attrs.stroke;
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			context.lineTo(conn.to.x, conn.to.y);
			canvas.stroke(this);
			if (true) {
				var len = 14;
				if (conn.from.x < conn.to.x) {
					len = -len;
				}
				var m = (conn.to.y - conn.from.y) / (conn.to.x - conn.from.x);
				var n = Math.tan(Math.PI / 9);
				var a1x = conn.to.x + (1 - m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				var a1y = conn.to.y + (m + n) * len / Math.sqrt((1 + m * m)*(1 + n * n));
				var a2x = conn.to.x + (1 + m * n) * len / Math.sqrt((1 + m * m) * (1 + n * n));
				var a2y = conn.to.y + (m - n) * len / Math.sqrt((1 + m * m)*(1 + n * n));
				context.moveTo(a1x, a1y);
				context.lineTo(conn.to.x, conn.to.y);
				context.lineTo(a2x, a2y);
				context.lineTo(a1x, a1y);
				context.fill();
			}
		}
	};
	Kinetic.Global.extend(Kinetic.Link, Kinetic.Shape);
}());
Kinetic.Link.prototype.setMMAttr = function (newMMAttr) {
	'use strict';
	var style = newMMAttr && newMMAttr.style;
	this.attrs.stroke = style && style.color || 'red';
	this.attrs.dashArray = {
		solid: [],
		dashed: [8, 8]
	}[style && style.lineStyle || 'dashed'];
	this.getLayer().draw();
};
