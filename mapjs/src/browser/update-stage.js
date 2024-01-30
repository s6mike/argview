/*global require */
const jQuery = require('jquery');
// TODO: Could replace with HTMLElement.prototype.updateStage, but since only stage object needs it, better to add it to that instead
jQuery.fn.updateStage = function () {
  'use strict';
  const data = this.data(),
    stage = this[0],
    size = {
      // Looks like mins don't matter
      // 'min-width': Math.round(data.width - data.offsetX),
      // 'min-height': Math.round(data.height - data.offsetY),
      // 'width': Math.round(data.width - data.offsetX),
      'height': Math.round(data.height - data.offsetY),
      // 'left': 'min(' + Math.round(-data.offsetX) + 'px, ' + 1424 + 'px)',
      // 'margin-left': Math.round(-data.offsetX),
      // 'transform-origin': 'top left',
      // Now using style.css with simple 50% to keep it centered
      //  This change is so the argmap theme's root node is near the top of the container, might not be so good for regular mind-map layout.
      //  'transform': 'translate3d(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px, 0)'
      // 'transform': 'translate3d(' + Math.round(data.offsetX) + 'px, 30%, 0)'
    },
    root = document.documentElement,
    svgContainer = this.find('[data-mapjs-role=svg-container]')[0];

  // QUESTION: Move this to mapjs/src/browser/dom-map-widget.js after offsetX defined?
  root.style.setProperty('--width-stage-offsetx', `${Math.round(data.offsetX)}px`);
  // if (data.scale && data.scale !== 1) {
  //   // size.transform = 'scale(' + data.scale + ') translate(' + Math.round(data.offsetX) + 'px, ' + Math.round(data.offsetY) + 'px)';
  //   // size.transform = 'scale(' + data.scale + ') translate(' + Math.round(data.offsetX) + 'px, 30%)';
  // }
  this.css(size);
  // stage.style.left = `min(${Math.round(-data.offsetX)}px), -800px)`;
  // 'min(' + Math.round(-data.offsetX) + 'px, ' + 1424 + 'px)';
  if (svgContainer) {
    svgContainer.setAttribute('viewBox',
      '' + Math.round(-data.offsetX) + ' ' + Math.round(-data.offsetY) + ' ' + Math.round(data.width) + ' ' + Math.round(data.height)
      // '' + 0 + ' ' + Math.round(-1 * data.offsetY) + ' ' + 0.1 + ' ' + Math.round(data.height)
    );
    svgContainer.setAttribute('style',
      'top:' + Math.round(-data.offsetY) + 'px; ' +
      'left:' + Math.round(-data.offsetX) + 'px; ' +
      'width:' + Math.round(data.width) + 'px; ' +
      // 'width: 0; ' +
      'height:' + Math.round(data.height) + 'px;'
    );
  }
  return this;
};

