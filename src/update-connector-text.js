/*global module, require */
const createSVG = require('./create-svg'),
	getTextElement = function (parentElement, labelText, elementType) {
		'use strict';
		elementType = elementType || 'text';
		let textElement = parentElement.find(elementType + '.mapjs-connector-text');
		if (!labelText) {
			textElement.remove();
			return false;
		} else {
			if (textElement.length === 0) {
				textElement = createSVG(elementType).attr('class', 'mapjs-connector-text');
				textElement.appendTo(parentElement);
			}
			return textElement;
		}
	},
	updateConnectorText = function (parentElement, centrePoint, labelText, labelTheme) {
		'use strict';
		const rectElement = getTextElement(parentElement, labelText, 'rect'),
			textElement = getTextElement(parentElement, labelText),
			textDOM = textElement && textElement[0],
			rectDOM = rectElement && rectElement[0];

		let dimensions = false;
		if (!textDOM) {
			return false;
		}
		textDOM.style.stroke = 'none';
		textDOM.style.fill = labelTheme.text.color;
		textDOM.style.fontSize = labelTheme.text.font.sizePx + 'px';
		textDOM.style.fontWeight = labelTheme.text.font.weight;
		textDOM.style.dominantBaseline = 'hanging';
		textElement.text(labelText.trim());
		dimensions = textDOM.getClientRects()[0];
		textDOM.setAttribute('x', Math.round(centrePoint.x - dimensions.width / 2));
		textDOM.setAttribute('y', Math.round(centrePoint.y - dimensions.height));
		rectDOM.setAttribute('x', Math.round(centrePoint.x - dimensions.width / 2));
		rectDOM.setAttribute('y', Math.round(centrePoint.y - dimensions.height - 2));
		rectDOM.setAttribute('height', Math.round(dimensions.height));
		rectDOM.setAttribute('width', Math.round(dimensions.width));
		rectDOM.style.fill = labelTheme.backgroundColor;
		rectDOM.style.stroke = labelTheme.borderColor;
		return textElement;
	};

module.exports = updateConnectorText;
