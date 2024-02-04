const jQuery = require('jquery');

// TODO: Remove jQuery
module.exports = function linkEditWidget(mapModel, linkEditWidgetElement) {
  // jQuery.fn.linkEditWidget = function (mapModel) {
  'use strict';
  // return this.each(function () {
  const element = jQuery(linkEditWidgetElement),
    colorElement = element.find('.color'),
    lineStyleElement = element.find('.lineStyle'),
    arrowElement = element.find('.arrow');
  let currentLink, width, height;
  element.hide();
  mapModel.addEventListener('linkSelected', function (link, selectionPoint, linkStyle) {
    currentLink = link;
    element.show();
    width = width || element.width();
    height = height || element.height();
    element.css({
      top: (selectionPoint.y - 0.5 * height - 15) + 'px',
      left: (selectionPoint.x - 0.5 * width - 15) + 'px'
    });
    colorElement.val(linkStyle.color).change();
    lineStyleElement.val(linkStyle.lineStyle);
    // This tampers with whether button is active after being clicked, when it should be deciding impact on arrow.
    // Seems counterproductive, disabling.
    // arrowElement[linkStyle.arrow ? 'addClass' : 'removeClass']('active');
  });
  mapModel.addEventListener('mapMoveRequested', function () {
    element.hide();
  });
  element.find('.delete').click(function () {
    if (!currentLink) { // Added check to stop error message when delete link button clicked without any link selected.
      return false;
    }
    mapModel.removeLink('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo);
    element.hide();
  });
  colorElement.change(function () {
    mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'color', jQuery(this).val());
  });
  // Fixes linestyle selector:
  // lineStyleElement.find('a').click(function () {
  lineStyleElement.change(function () {
    mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'lineStyle', jQuery(this).val()); // Changed from text() to val() so that value is set correctly.
  });
  arrowElement.click(function () {
    // Easier to toggle arrow value from within updateLinkStyle function than based on any kind of button state
    mapModel.updateLinkStyle('mouse', currentLink.ideaIdFrom, currentLink.ideaIdTo, 'arrow', undefined);
  });
  // Removing so menu stays visible after mouse over or link change.
  // element.mouseleave(element.hide.bind(element));
  // });
  return element;
};
