/*global require, module */
const _ = require('underscore'),
  Theme = require('./theme'),
  calcChildPosition = require('./calc-child-position'),
  lineTypes = require('./line-types'),
  nodeConnectionPointX = require('./node-connection-point-x'),
  { default: CONFIG } = require('Mapjs/' + PATH_FILE_CONFIG_MAPJS),
  CONNECTOR_CLASS = CONFIG.connector.class,
  appendUnderLine = function (connectorCurve, calculatedConnector, position) {
    'use strict';
    if (calculatedConnector.nodeUnderline) {
      connectorCurve.d += 'M' + (calculatedConnector.nodeUnderline.from.x - position.left) + ',' + (calculatedConnector.nodeUnderline.from.y - position.top) + ' H' + (calculatedConnector.nodeUnderline.to.x - position.left);
    }
    return connectorCurve;
  },
  appendOverLine = function (connectorCurve, calculatedConnector) {
    'use strict';
    const initialRadius = connectorCurve.initialRadius || 0,
      halfWidth = calculatedConnector.nodeOverline && (Math.floor(0.5 * Math.abs(calculatedConnector.nodeOverline.to.x - calculatedConnector.nodeOverline.from.x)) - 1);

    if (calculatedConnector.nodeOverline) {
      connectorCurve.d += 'm' + (-1 * halfWidth) + ',' + initialRadius +
        'q0,' + (-1 * initialRadius) + ' ' + initialRadius + ',' + (-1 * initialRadius) +
        ' h' + (2 * (halfWidth - initialRadius)) +
        'q' + initialRadius + ',0 ' + initialRadius + ',' + initialRadius;
    }
    return connectorCurve;

  },
  appendBorderLines = function (connectorCurve, calculatedConnector, position) {
    'use strict';
    return appendOverLine(appendUnderLine(connectorCurve, calculatedConnector, position), calculatedConnector);
  },
  nodeConnectionPointY = {
    'center': function (node) {
      'use strict';
      return Math.round(node.top + node.height * 0.5);
    },
    'base': function (node) {
      'use strict';
      return node.top + node.height + 1;
    },
    'base-inset': function (node, inset) {
      'use strict';
      return node.top + node.height + 1 - inset;
    },
    'top': function (node) {
      'use strict';
      return node.top;
    }
  },

  calculateConnector = function (parent, child, theme) {
    'use strict';
    const childPosition = calcChildPosition(parent, child, 10),
    // Either parent.styles[0] or child.styles[0] will contain attr_group_opposing or attr_group_supporting
    //  So can check this then apply class
      fromStyles = parent.styles,
      toStyles = child.styles,
      connectionPositionDefaultFrom = theme.attributeValue(['node'], fromStyles, ['connections', 'default'], { h: 'center', v: 'center' }),
      connectionPositionDefaultTo = theme.attributeValue(['node'], toStyles, ['connections', 'default'], { h: 'nearest-inset', v: 'center' }),
      connectionPositionFrom = _.extend({}, connectionPositionDefaultFrom, theme.attributeValue(['node'], fromStyles, ['connections', 'from', childPosition], {})),
      connectionPositionTo = _.extend({}, connectionPositionDefaultTo, theme.attributeValue(['node'], toStyles, ['connections', 'to'], {})),
    // TODO: Add class instead of assigning line.color (and line-width?)
      connectorTheme = theme.connectorTheme(childPosition, toStyles, fromStyles),
      fromInset = theme.attributeValue(['node'], fromStyles, ['cornerRadius'], 10),
      toInset = theme.attributeValue(['node'], toStyles, ['cornerRadius'], 10),
      borderType = theme.attributeValue(['node'], toStyles, ['border', 'type'], '');

    // QUESTION: Use regex extract instead?
    const child_style = child?.styles?.[0];
    switch (child_style) {
      case 'attr_group_supporting':
        connectorTheme.class = `${CONNECTOR_CLASS}-supporting`;
        break;
      case 'attr_group_opposing':
        connectorTheme.class = `${CONNECTOR_CLASS}-opposing`;
        break;
      // default:
      //   ;
    }

    let nodeUnderline = false, nodeOverline = false;
    if (borderType === 'underline' || borderType === 'under-overline') {
      nodeUnderline = {
        from: {
          x: child.left,
          y: child.top + child.height + 1
        },
        to: {
          x: child.left + child.width,
          y: child.top + child.height + 1
        }
      };
    }
    if (borderType === 'overline' || borderType === 'under-overline') {
      nodeOverline = {
        from: {
          x: child.left,
          y: child.top
        },
        to: {
          x: child.left + child.width,
          y: child.top
        }
      };
    }

    return {
      from: {
        x: nodeConnectionPointX[connectionPositionFrom.h](parent, child, fromInset),
        y: nodeConnectionPointY[connectionPositionFrom.v](parent, fromInset)
      },
      to: {
        x: nodeConnectionPointX[connectionPositionTo.h](child, parent, toInset),
        y: nodeConnectionPointY[connectionPositionTo.v](child, toInset)
      },
      connectorTheme: connectorTheme,
      nodeUnderline: nodeUnderline,
      nodeOverline: nodeOverline
    };
  },
  themePath = function (parent, child, themeArg) {
    'use strict';
    const left = Math.min(parent.left, child.left),
      top = Math.min(parent.top, child.top),
      position = {
        left: left,
        top: top,
        width: Math.max(parent.left + parent.width, child.left + child.width, left + 1) - left,
        height: Math.max(parent.top + parent.height, child.top + child.height, top + 1) - top + 2
      },
      theme = themeArg || new Theme({}),
      calculatedConnector = calculateConnector(parent, child, theme),
      result = appendBorderLines(lineTypes[calculatedConnector.connectorTheme.type](calculatedConnector, position, parent, child), calculatedConnector, position);
    result.color = calculatedConnector.connectorTheme.line.color;
    result.width = calculatedConnector.connectorTheme.line.width;
    result.theme = calculatedConnector.connectorTheme;
    result.class = result.theme?.class;

    return result;
  };

module.exports = themePath;
