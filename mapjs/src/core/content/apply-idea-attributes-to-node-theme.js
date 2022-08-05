/*global module, require*/

const foregroundStyle = require('../theme/foreground-style');
module.exports = function applyIdeaAttributesToNodeTheme(idea, nodeTheme) {
	'use strict';
	if (!nodeTheme  || !idea || !idea.attr || !idea.attr.style) {
		return nodeTheme;
	}
	const isColorSetByUser = () => {
			const setByUser = idea.attr && idea.attr.style && idea.attr.style.background;
			if (setByUser === 'false' || setByUser === 'transparent') {
				return false;
			}
			return setByUser;

		},
		fontMultiplier = idea.attr.style.fontMultiplier,
		textAlign = idea.attr.style.textAlign,
		colorSetByUser = isColorSetByUser(),
		colorText = nodeTheme.borderType !== 'surround';

	if (colorSetByUser) {
		if (colorText) {
			nodeTheme.text.color = colorSetByUser;
		} else {
			nodeTheme.text.color = nodeTheme.text[foregroundStyle(colorSetByUser)];
			nodeTheme.backgroundColor = colorSetByUser;
		}
	}

	if (textAlign) {
		nodeTheme.text = Object.assign({}, nodeTheme.text, {alignment: textAlign});
	}

	if ((nodeTheme && nodeTheme.hasFontMultiplier)) {
		return nodeTheme;
	}

	if (!nodeTheme.font || !fontMultiplier || Math.abs(fontMultiplier) <= 0.01 || Math.abs(fontMultiplier - 1) <= 0.01) {
		return nodeTheme;
	}
	if (nodeTheme.font.size) {
		nodeTheme.font.size = nodeTheme.font.size * fontMultiplier;
	}

	if (nodeTheme.font.lineSpacing) {
		nodeTheme.font.lineSpacing = nodeTheme.font.lineSpacing * fontMultiplier;
	}

	if (nodeTheme.font.sizePx) {
		nodeTheme.font.sizePx = nodeTheme.font.sizePx * fontMultiplier;
	}
	if (nodeTheme.font.lineSpacingPx) {
		nodeTheme.font.lineSpacingPx = nodeTheme.font.lineSpacingPx * fontMultiplier;
	}
	nodeTheme.hasFontMultiplier = true;


	return nodeTheme;
};
