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
$.fn.domMapWidget = function (activityLog, mapModel, touchEnabled) {
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
		actOnKeys = true;
	mapModel.addEventListener('inputEnabledChanged', function (canInput) {
		actOnKeys = canInput;
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
			}).updateStage();
		element.css('overflow', 'auto');
		//element.draggableContainer();
		if (!touchEnabled) {
			element.scrollWhenDragging(); //no need to do this for touch, this is native
		}
		MAPJS.DOMRender.viewController(mapModel, stage);
		_.each(hotkeyEventHandlers, function (mappedFunction, keysPressed) {
			element.keydown(keysPressed, function (event) {
				if (actOnKeys) {
					event.preventDefault();
					mapModel[mappedFunction]('keyboard');
				}
			});
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


// --------- read only ------------
// round coordinates for
//  * CSS translation
//  * nodes
//
// --------- editing --------------
// - don't set contentEditable
// - enable drag & drop
// drop
// editing as span or as textarea - grow automatically

// collaboration avatars
// activated
// mouse events
// mapwidget keyboard bindings
// mapwidget mouse bindings
// html export


//- v2 -
// collaboration - collaborator images
// straight lines extension
// prevent scrolling so the screen is blank
//
//
// remaining kinetic mediator events
//
// viewing
// +	mapModel.addEventListener('nodeCreated', function (n) {
// +	mapModel.addEventListener('connectorRemoved', function (n) {
// +	mapModel.addEventListener('linkCreated', function (l) {
// +	mapModel.addEventListener('linkRemoved', function (l) {
// +	mapModel.addEventListener('nodeMoved', function (n, reason) {
// +	mapModel.addEventListener('nodeRemoved', function (n) {
// +	mapModel.addEventListener('connectorCreated', function (n) {
// +	mapModel.addEventListener('nodeFocusRequested', function (ideaId)  {
// +	mapModel.addEventListener('layoutChangeComplete', function () {
// +	mapModel.addEventListener('mapScaleChanged', function (scaleMultiplier, zoomPoint) {
// +	mapModel.addEventListener('mapViewResetRequested', function () {
// editing
// -	mapModel.addEventListener('mapMoveRequested', function (deltaX, deltaY) {
// -	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
// -	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
// +	mapModel.addEventListener('nodeAttrChanged', function (n) {
// -	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
// +	mapModel.addEventListener('nodeTitleChanged', function (n) {
// -	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {
// -	mapModel.addEventListener('linkAttrChanged', function (l) {
