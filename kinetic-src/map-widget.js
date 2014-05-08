/*global _, jQuery, Kinetic, MAPJS, window, document, $, MutationObserver*/
jQuery.fn.mapWidget = function (activityLog, mapModel, touchEnabled, imageInsertController) {
	'use strict';

	return this.each(function () {
		var element = jQuery(this),
			stage = new Kinetic.Stage({
				container: this.id,
				draggable: true
			}),
			/*jshint unused:false */
			mediator = new MAPJS.KineticMediator(mapModel, stage),
			setStageDimensions = function () {
				var changed;
				if (stage.getWidth() !== element.width()) {
					stage.setWidth(element.width());
					changed = true;
				}
				if (stage.getHeight() !== element.height()) {
					stage.setHeight(element.height());
					changed = true;
				}
				if (changed) {
					stage.draw();
				}
				return changed;
			},
			lastGesture,
			actOnKeys = true,
			discrete = function (gesture) {
				var result = (lastGesture && lastGesture.type !== gesture.type && (gesture.timeStamp - lastGesture.timeStamp < 250));
				lastGesture = gesture;
				return !result;
			},
			hotkeyEventHandlers = {
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
			onScroll = function (event, delta, deltaX, deltaY) {
				deltaX = deltaX || 0; /*chromebook scroll fix*/
				deltaY = deltaY || 0;
				if (event.target === jQuery(stage.getContainer()).find('canvas')[0]) {
					if (Math.abs(deltaX) < 5) {
						deltaX = deltaX * 5;
					}
					if (Math.abs(deltaY) < 5) {
						deltaY = deltaY * 5;
					}
					mapModel.move('mousewheel', -1 * deltaX, deltaY);
					if (event.preventDefault) { // stop the back button
						event.preventDefault();
					}
				}
			},
			resizeAndCenter = function () {
				if (setStageDimensions()) {
					if (mapModel.getIdea() !== undefined) {
						mapModel.centerOnNode(mapModel.getSelectedNodeId() ||  1);
					} else {
						stage.setX(0.5 * stage.getWidth());
						stage.setY(0.5 * stage.getHeight());
						stage.draw();
					}

				}
			};
		_.each(hotkeyEventHandlers, function (mappedFunction, keysPressed) {
			jQuery(document).keydown(keysPressed, function (event) {
				if (actOnKeys) {
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
		});
		MAPJS.dragdrop(mapModel, stage, imageInsertController);
		$(document).on('keypress', function (evt) {
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
		element.data('mm-stage', stage);
		mapModel.addEventListener('inputEnabledChanged', function (canInput) {
			actOnKeys = canInput;
		});
		setStageDimensions();
		stage.setX(0.5 * stage.getWidth());
		stage.setY(0.5 * stage.getHeight());

		if (window && window.MutationObserver && element.data('mm-context') !== 'embedded') {
			new MutationObserver(resizeAndCenter).observe(element[0], {attributes: true});
		} else {
			jQuery(element[0]).bind(' resize', resizeAndCenter);
		}

		jQuery(window).bind('orientationchange resize', setStageDimensions);
		element.on('contextmenu', function (e) { e.preventDefault(); e.stopPropagation(); return false; });
		element.on('mousedown touch', function (e) {
			window.focus();
			if (document.activeElement !== e.target) {
				document.activeElement.blur();
			}
		});
		if (!touchEnabled) {
			jQuery(window).mousewheel(onScroll);
		} else {
			element.find('canvas').hammer().on('pinch', function (event) {
				if (discrete(event)) {
					mapModel.scale('touch', event.gesture.scale, {
						x: event.gesture.center.pageX - element.offset().left,
						y: event.gesture.center.pageY - element.offset().top
					});
				}
			}).on('swipe', function (event) {
				if (discrete(event)) {
					mapModel.move('touch', event.gesture.deltaX, event.gesture.deltaY);
				}
			}).on('doubletap', function () {
				mapModel.resetView();
			}).on('touch', function () {
				jQuery('.topbar-color-picker:visible').hide();
				jQuery('.ideaInput:visible').blur();
			});
		}
	});
};
