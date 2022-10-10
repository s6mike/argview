/*global require, document, window */
const $ = require('jquery'),
	_ = require('underscore'),
	createSVG = require('./create-svg');

require('imports-loader?jQuery=jquery!jquery.hotkeys');

$.fn.scrollWhenDragging = function (scrollPredicate) {
	'use strict';
	return this.each(function () {
		const element = $(this);
		let dragOrigin;
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
$.fn.domMapWidget = function (activityLog, mapModel, touchEnabled, dragContainer, centerSelectedNodeOnOrientationChange) {
	'use strict';
	const hotkeyEventHandlers = {
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
		'ctrl+shift+v meta+shift+v': 'pasteStyle',
		'u meta+z ctrl+z': 'undo',
		'r meta+shift+z ctrl+shift+z meta+y ctrl+y': 'redo',
		'meta+plus ctrl+plus z': 'scaleUp',
		'meta+minus ctrl+minus shift+z': 'scaleDown',
		'Esc 0 meta+0 ctrl+0': 'resetView',
		// 'Esc': 'cancelCurrentAction'
	},
		charEventHandlers = {
			'[': 'activateChildren',
			'{': 'activateNodeAndChildren',
			'=': 'activateSiblingNodes',
			'.': 'activateSelectedNode',
			'/': 'toggleCollapse',
			'a': 'openAttachment',
			'i': 'editIcon'
		},
		self = this;
	let actOnKeys = true;
	mapModel.addEventListener('inputEnabledChanged', function (canInput, holdFocus) {
		actOnKeys = canInput;
		if (canInput && !holdFocus) {
			self.focus();
		}
	});

	return this.each(function () {
		const element = $(this),
			svgContainer = createSVG()
				.css({
					position: 'absolute',
					top: 0,
					left: 0
				})
				.attr({
					'data-mapjs-role': 'svg-container',
					'class': 'mapjs-draw-container'
				}),
			stage = $('<div>')
				.css(
					{
						position: 'relative'
					})
				.attr('data-mapjs-role', 'stage')
				.appendTo(element)
				.data({
					'offsetX': element.innerWidth() / 2,
					'offsetY': element.innerHeight() / 2,
					'width': element.innerWidth() - 20,
					'height': element.innerHeight() - 20,
					'scale': 1
				})
				.append(svgContainer)
				.updateStage();
		let previousPinchScale = false;
		// Moved this css overflow:auto setting to mapjs-default-styles.css file, so it's easier to override mapjs-container setting.
		// element.css('overflow', 'auto').attr('tabindex', 1);
		// tabindex ensures that container can receive focus
		// Set index to 0 rather than 1 because 1 is considered bad practice for accessibility. 
		// See: https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex#sect2 
		element.attr('tabindex', 0);
		if (mapModel.getInputEnabled()) {
			(dragContainer || element).simpleDraggableContainer();
		}

		if (!touchEnabled) {
			element.scrollWhenDragging(mapModel.getInputEnabled); //no need to do this for touch, this is native
			// Keeps elements visible when dragging them out of the container:
			// element.on('mm:start-dragging-shadow', function (e) {
			// 	if (e.target !== element[0]) {
			// 		element.css('overflow', 'hidden');
			// 	}
			// });
			// $(document).on('mouseup', function () {
			// 	if (element.css('overflow') !== 'auto') {
			// 		element.css('overflow', 'auto');
			// 	}
			// });
		} else {
			element.on('doubletap', function (event) {
				if (mapModel.requestContextMenu(event.gesture.center.pageX, event.gesture.center.pageY)) {
					event.preventDefault();
					event.gesture.preventDefault();
					return false;
				}
			}).on('pinch', function (event) {
				let scale;
				if (!event || !event.gesture || !event.gesture.scale) {
					return;
				}
				event.preventDefault();
				event.gesture.preventDefault();

				scale = event.gesture.scale;
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
			$(window).on('resize', function () {
				mapModel.resetView();
			});
		}

		$(window).on('orientationchange', function () {
			if (centerSelectedNodeOnOrientationChange) {
				mapModel.centerOnNode(mapModel.getSelectedNodeId());
			} else {
				mapModel.resetView();
			}

		});
		// ISSUE: Listening at document level is unintuitive, should add this at container level like the rest.
		// 	https://github.com/s6mike/mapjs/issues/4
		$(document).on('keydown', function (e) {
			const functions = {
				'U+003D': 'scaleUp',
				'U+002D': 'scaleDown',
				61: 'scaleUp',
				173: 'scaleDown',
				187: 'scaleUp',
				189: 'scaleDown',
			};
			let mappedFunction;
			if (e && !e.altKey && (e.ctrlKey || e.metaKey)) {
				// ISSUE: keyCode event works, but is deprecated
				//	https://github.com/s6mike/mapjs/issues/3
				if (e.originalEvent && e.originalEvent.keyCode) { /* webkit */
					mappedFunction = functions[e.originalEvent.keyCode];
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
			const scroll = e.originalEvent.deltaX || (-1 * e.originalEvent.wheelDeltaX);
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
			const unicode = evt.charCode || evt.keyCode,
				actualkey = String.fromCharCode(unicode),
				mappedFunction = charEventHandlers[actualkey];
			if (mappedFunction) {
				evt.preventDefault();
				mapModel[mappedFunction]('keyboard');
			} else if ((Number(actualkey) <= 9 && Number(actualkey) >= 1) || actualkey === '0') {
				evt.preventDefault();
				mapModel.activateLevel('keyboard', Number(actualkey) + 1);
			}
		});
	});
};
