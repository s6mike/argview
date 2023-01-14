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
			textDOM = textElement && textElement[0];

		if (!textDOM) { // This has to be checked before trying to get linkDimensions.
			return false;
		};
		let textDimensions = false;
		// eslint-disable-next-line one-var
		const rectDOM = rectElement && rectElement[0],
			translate = {},
			// TODO: Get classname from config
			linkDimensions = parentElement[0].getElementsByClassName('mapjs-connector')[0].getClientRects()[0],
			// Want connector label to be nearer parent node:
			// 	Again, this is more for argmap, so may not work well in other themes.
			dleft = (linkDimensions.left - centrePoint.x),
			dright = (linkDimensions.right - centrePoint.x);

		textDOM.style.stroke = 'none';
		textDOM.style.fill = labelTheme.text.color;
		textDOM.style.fontSize = labelTheme.text.font.sizePx + 'px';
		textDOM.style.fontWeight = labelTheme.text.font.weight;
		textDOM.style.dominantBaseline = 'hanging';
		textElement.text(labelText.trim());
		textDimensions = textDOM.getClientRects()[0];

		// translate.x number not very good, the mapjs-connector ClientRects.left and .right don't seem to relate to the actual boundary of the element.
		// TODO: Not sure why not, might be that BoundingClientRect or BBox works better. Or might need to look up location of parent node instead.
		// translate.x = Math.round(centrePoint.x - textDimensions.width / 2);
		// translate.y = Math.round(centrePoint.y - textDimensions.height - 2);
		translate.x = centrePoint.x + Math.round((Math.abs(dleft) < Math.abs(dright) ? dleft : dright)) / 100;
		translate.y = Math.round(centrePoint.y - linkDimensions.height * 0.5);

		g[0].style.transform = `translate(${translate.x}px, ${translate.y}px)`;
		textDOM.setAttribute('x', 0); // Math.round(centrePoint.x - textDimensions.width / 2));
		textDOM.setAttribute('y', 2); // Math.round(centrePoint.y - textDimensions.height));

		// rectDOM.style.left = Math.round(centrePoint.x - textDimensions.width / 2);
		// rectDOM.style.top = Math.round(centrePoint.y - textDimensions.height - 2);
		rectDOM.setAttribute('x', 0); // Math.round(centrePoint.x - textDimensions.width / 2));
		rectDOM.setAttribute('y', 0); // Math.round(centrePoint.y - textDimensions.height - 2));
		rectDOM.setAttribute('height', Math.round(textDimensions.height));
		rectDOM.setAttribute('width', Math.round(textDimensions.width));
		rectDOM.style.fill = labelTheme.backgroundColor;
		rectDOM.style.stroke = labelTheme.borderColor;
		return textElement;
	};

module.exports = updateConnectorText;
