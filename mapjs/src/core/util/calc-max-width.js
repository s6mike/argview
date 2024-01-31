/*global module*/

module.exports = function calcMaxWidth(attr, nodeTheme/*, options*/) {
  'use strict';
  return attr?.style?.width || nodeTheme?.text?.maxWidth;
};
