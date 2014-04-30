/*jslint nomen: true, newcap: true, browser: true*/
/*global MAPJS, $, Hammer, _, jQuery*/

jQuery.fn.scrollWhenDragging = function () {
	/*jslint newcap:true*/
	'use strict';
	Hammer(this);
	return this.each(function () {
		var element = $(this),
			dragOrigin;
		element.on('dragstart', function () {
			dragOrigin = {
				top: element.scrollTop(),
				left: element.scrollLeft()
			};
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
$.fn.domMapWidget = function (activityLog, mapModel, touchEnabled, imageInsertController) {
	'use strict';
	var hotkeyEventHandlers = {
			'return': 'addSiblingIdea',
			'shift+return': 'addSiblingIdeaBefore',
			'del backspace': 'removeSubIdea',
			'tab insert': 'addSubIdea',
			'left': 'selectNodeLeft',
			'up': 'selectNodeUp',
			'right': 'selectNodeRight',
			'shift+right': 'activateNodeRight',
			'shift+left': 'activateNodeLeft',
			'shift+up': 'activateNodeUp',
			'shift+down': 'activateNodeDown',
			'down': 'selectNodeDown',
			'space f2': 'editNode',
			'f': 'toggleCollapse',
			'c meta+x ctrl+x': 'cut',
			'p meta+v ctrl+v': 'paste',
			'y meta+c ctrl+c': 'copy',
			'u meta+z ctrl+z': 'undo',
			'shift+tab': 'insertIntermediate',
			'Esc 0 meta+0 ctrl+0': 'resetView',
			'r meta+shift+z ctrl+shift+z meta+y ctrl+y': 'redo',
			'meta+plus ctrl+plus z': 'scaleUp',
			'meta+minus ctrl+minus shift+z': 'scaleDown',
			'meta+up ctrl+up': 'moveUp',
			'meta+down ctrl+down': 'moveDown',
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
				'width': element.innerWidth(),
				'height': element.innerHeight(),
				'scale': 1
			}).updateStage(),
			previousPinchScale = false;
		element.css('overflow', 'auto').attr('tabindex', 1);
		if (mapModel.isEditingEnabled()) {
			element.simpleDraggableContainer();
		}
		if (!touchEnabled) {
			element.scrollWhenDragging(); //no need to do this for touch, this is native
			element.imageDropWidget(imageInsertController);
		} else {
			element.on('doubletap', function (event) {
				mapModel.dispatchEvent('contextMenuRequested', mapModel.getCurrentlySelectedIdeaId(), event.gesture.center.pageX, event.gesture.center.pageY);
				event.preventDefault();
				event.gesture.preventDefault();
				return false;
			}).on('pinch', function (event) {
				if (!event || !event.gesture || !event.gesture.scale) {
					return;
				}
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
		MAPJS.DOMRender.viewController(mapModel, stage, touchEnabled, imageInsertController);
		_.each(hotkeyEventHandlers, function (mappedFunction, keysPressed) {
			element.keydown(keysPressed, function (event) {
				if (actOnKeys) {
					event.stopImmediatePropagation();
					event.preventDefault();
					mapModel[mappedFunction]('keyboard');
				}
			});
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
