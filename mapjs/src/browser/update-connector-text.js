/*global module, require */
const createSVG = require('./create-svg'),
	getTextElement = function (parentElement, labelText, elementType, centrePoint) {
		'use strict';
		elementType = elementType || 'text';
		let textElement = parentElement.find(elementType + '.mapjs-connector-text');
		if (!labelText) {
			textElement.remove();
			return false;
		} else {
			if (textElement.length === 0) {
				textElement = createSVG(elementType).attr('class', 'mapjs-connector-text');
				if (centrePoint) {
					textElement[0].style.transform = `translate(${centrePoint.x}px, ${centrePoint.y}px)`;
				}
				textElement.appendTo(parentElement);
			}
			return textElement;
		}
	},
	updateConnectorText = function (parentElement, centrePoint, labelText, labelTheme) {
		'use strict';
		const g = getTextElement(parentElement, labelText, 'g', centrePoint),
			rectElement = g && getTextElement(g, labelText, 'rect'),
			textElement = g && getTextElement(g, labelText),
			textDOM = textElement && textElement[0],
			rectDOM = rectElement && rectElement[0],
			translate = {};

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
		translate.x = Math.round(centrePoint.x - dimensions.width / 2);
		translate.y = Math.round(centrePoint.y - dimensions.height - 2);
		// textDOM.style.left = Math.round(centrePoint.x - dimensions.width / 2);
		// textDOM.style.top = Math.round(centrePoint.y - dimensions.height);
		g[0].style.transform = `translate(${translate.x}px, ${translate.y}px)`;
		textDOM.setAttribute('x', 0); //Math.round(centrePoint.x - dimensions.width / 2));
		textDOM.setAttribute('y', 2); //Math.round(centrePoint.y - dimensions.height));

		// rectDOM.style.left = Math.round(centrePoint.x - dimensions.width / 2);
		// rectDOM.style.top = Math.round(centrePoint.y - dimensions.height - 2);
		rectDOM.setAttribute('x', 0); //Math.round(centrePoint.x - dimensions.width / 2));
		rectDOM.setAttribute('y', 0); //Math.round(centrePoint.y - dimensions.height - 2));
		rectDOM.setAttribute('height', Math.round(dimensions.height));
		rectDOM.setAttribute('width', Math.round(dimensions.width));
		rectDOM.style.fill = labelTheme.backgroundColor;
		rectDOM.style.stroke = labelTheme.borderColor;
		return textElement;
	};

module.exports = updateConnectorText;
