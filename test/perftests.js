/*global jQuery, window, mapModel, Kinetic, setInterval, console*/
(function () {
	'use strict';
	window.startPerformanceTest = function (test, mapMultiplication, multiplicationType) {
		test = test || 'fold';
		var cycle = function (callback) {
				var cycleText = jQuery('#cyclerate'),
					cycles = 0,
					cycleTime = 0,
					interval = setInterval(function () {
						var start = Date.now();
						callback(cycles);
						cycleTime += Date.now() - start;
						cycles++;
						if (cycles % 30) {
							cycleText.text((cycles * 1000 / cycleTime).toFixed(2));
						}
					}, 100);
				console.log('run clearInterval(' + interval + ') to stop');
			},
			tests = {
				fold: function () {
					mapModel.selectNode(1);
					cycle(function () {
						window.mapModel.toggleCollapse();
					});
				},
				move: function () {
					mapModel.selectNode(1);
					mapModel.selectNodeLeft();
					cycle(function (cycles) {
						if ((cycles / 7).toFixed(0) % 2) {
							window.mapModel.moveUp();
						} else {
							window.mapModel.moveDown();
						}
					});
				},
				scroll: function () {
					new Kinetic.Tween({node: jQuery('#container').data('mm-stage'), x: 1000, y: 400, duration: 10}).play();
				},
				select: function () {
					mapModel.selectNode(1);
					cycle(function (cycles) {
						mapModel.activateLevel('test', (cycles % 4) + 1);
					});
				},
				style: function () {
					var colors = ['#FF0000', '#00FF00', '#0000FF'];
					mapModel.activateLevel('test', 3);
					cycle(function (cycles) {
						mapModel.updateStyle('test', 'background', colors[cycles % colors.length]);
					});
				},
			},
			i;
		if (mapMultiplication) {
			mapModel.copy();
			for (i = 0; i < mapMultiplication; i++) {
				if (multiplicationType === 'center') {
					mapModel.selectNode(1);
				}
				mapModel.paste();
			}
		}
		tests[test]();
	};
	var oldRequestAnimationFrame = Kinetic.Animation.requestAnimFrame,
		framerateText = jQuery('#framerate'),
		t0 = Date.now(),
		frames = 0;
	Kinetic.Animation.requestAnimFrame = function () {
		var lapsed = Date.now() - t0;
		frames++;
		if (oldRequestAnimationFrame) {
			oldRequestAnimationFrame.apply(window, arguments);
		}
		if (lapsed > 3000) {
			framerateText.text((frames * 1000 / lapsed).toFixed(2));
			frames = 0;
			t0 = Date.now();
		}
	};
}());
