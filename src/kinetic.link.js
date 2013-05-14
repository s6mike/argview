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
			return {
				from: {
					x: parentX + 0.5 * parentWidth,
					y: parentY + 0.5 * parentHeight
				},
				to: {
					x: childX + 0.5 * childWidth,
					y: childY + 0.5 * childHeight
				}
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
			context.beginPath();
			context.moveTo(conn.from.x, conn.from.y);
			context.lineTo(conn.to.x, conn.to.y);
			canvas.stroke(this);
		}
	};
	Kinetic.Global.extend(Kinetic.Link, Kinetic.Shape);
}());
