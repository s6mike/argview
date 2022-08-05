/*global module, require*/
const defaultTheme = require('./default-theme'),
	deepFreeze = require('../util/deep-freeze'),
	firstNode = defaultTheme.node[0],
	defaultConnector = defaultTheme.connector.default;

module.exports = deepFreeze({
	nodeTheme: {
		margin: firstNode.text.margin,
		font: firstNode.text.font,
		maxWidth: firstNode.text.maxWidth,
		backgroundColor: firstNode.backgroundColor,
		borderType: firstNode.border.type,
		cornerRadius: firstNode.cornerRadius,
		lineColor: firstNode.border.line.color,
		lineWidth: firstNode.border.line.width,
		lineStyle: firstNode.border.line.style,
		text: {
			color: firstNode.text.color,
			lightColor: firstNode.text.lightColor,
			darkColor: firstNode.text.darkColor
		}
	},
	connectorControlPoint: {
		horizontal: defaultConnector.controlPoint.horizontal.height,
		default: defaultConnector.controlPoint.above.height
	},
	connectorTheme: {
		type: defaultConnector.type,
		label: defaultConnector.label,
		line: defaultConnector.line
	}
});
