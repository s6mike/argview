/*global Kinetic*/
Kinetic.Clip = function (config) {
	'use strict';
	Kinetic.Shape.call(this, config);
	this.shapeType = 'Clip';
	this._setDrawFuncs();
};
Kinetic.Clip.prototype.drawFunc = function (canvas) {
	'use strict';
	var xClip = this.getWidth() * 2 - this.getRadius() * 2;
	canvas.beginPath();
	canvas.moveTo(0, this.getClipTo());
	canvas._context.arcTo(0, 0, this.getWidth() * 2, 0,  this.getWidth());
	canvas._context.arcTo(this.getWidth() * 2, 0, this.getWidth() * 2, this.getHeight(),  this.getWidth());
	canvas._context.arcTo(this.getWidth() * 2, this.getHeight(), 0, this.getHeight(), this.getRadius());
	canvas._context.arcTo(xClip, this.getHeight(), xClip, 0, this.getRadius());
	canvas.lineTo(xClip, this.getClipTo() * 0.5);
	canvas.fillStrokeShape(this);
};
Kinetic.Factory.addGetterSetter(Kinetic.Clip, 'clipTo', 0);
Kinetic.Factory.addGetterSetter(Kinetic.Clip, 'radius', 0);
Kinetic.Util.extend(Kinetic.Clip, Kinetic.Shape);
