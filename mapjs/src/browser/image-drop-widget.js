/*jslint browser: true */
/*global mapInstance */
const jQuery = require('jquery');
jQuery.fn.imageDropWidget = function (imageInsertController) {
  'use strict';
  this.on('dragleave dragend', function () {
    // TODO: Use getElementMJS()
    Array.from(this.getElementsByClassName('droppable')).forEach((el) => el.classList.remove('droppable'));
  }).on('dragenter dragover', function (e) {
    const map = mapInstance[this.id],
      stageDropCoordinates = map.domMapController.stagePositionForPointEvent(e),
      // QUESTION: why return node id and not reference to node in getNodeIdAtPosition()?
      // Would avoid issues with ambiguous node IDs
      nodeAtDrop = stageDropCoordinates && map.mapModel.getNodeIdAtPosition(stageDropCoordinates.x, stageDropCoordinates.y);
    if (typeof (nodeAtDrop) !== 'undefined') {
      this.querySelector('#node_' + nodeAtDrop).classList.add('droppable');
    }
    if (e.originalEvent.dataTransfer) {
      return false;
    }
  }).on('drop', function (e) {
    const dataTransfer = e.originalEvent.dataTransfer;
    let htmlContent;
    e.stopPropagation();
    e.preventDefault();
    if (dataTransfer && dataTransfer.files && dataTransfer.files.length > 0) {
      imageInsertController.insertFiles(dataTransfer.files, e.originalEvent);
    } else if (dataTransfer) {
      htmlContent = dataTransfer.getData('text/html');
      imageInsertController.insertHtmlContent(htmlContent, e.originalEvent);
    }
    // TODO: Use getElementMJS()
    Array.from(this.getElementsByClassName('droppable')).forEach((el) => el.classList.remove('droppable'));
  });
  return this;
};
