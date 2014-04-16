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
		if (mapModel.isEditingEnabled()) {
			element.simpleDraggableContainer();
		}
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


// --------- editing --------------
// + activated
// + mapwidget keyboard bindings
// + editing as span or as textarea - grow automatically
// - enable drag & drop
//		only if mapmodel allows it
// drop
// MAPJS.dragdrop equivalent!
// collaboration avatars
// test for break-all when text is different from node text during edit
// drag & drop at scale
// focus after drop if going off screen
// mouse events

// mapwidget mouse bindings
// html export
// drag and drop images?

//- v2 -
// collaboration - collaborator images
// straight lines extension
// prevent scrolling so the screen is blank
// support for multiple stages so that eg stage ID is prepended to the node and connector IDs
// support for selectAll when editing nodes or remove that from the mapModel - do we still use it?
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
//		- do we need this? it was used onscroll and onswipe
// +	mapModel.addEventListener('addLinkModeToggled', function (isOn) {
// +	mapModel.addEventListener('nodeEditRequested', function (nodeId, shouldSelectAll, editingNew) {
// +	mapModel.addEventListener('nodeAttrChanged', function (n) {
// -	mapModel.addEventListener('nodeDroppableChanged', function (ideaId, isDroppable) {
// +	mapModel.addEventListener('nodeTitleChanged', function (n) {
// +	mapModel.addEventListener('activatedNodesChanged', function (activatedNodes, deactivatedNodes) {
// +	mapModel.addEventListener('linkAttrChanged', function (l) {
