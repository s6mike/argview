/*global module*/

const requiresRecursion = (toFreeze, prop) => {
		'use strict';
		return (typeof toFreeze[prop] === 'object' || typeof toFreeze[prop] === 'function') && !Object.isFrozen(toFreeze[prop]);
	},
	deepFreeze = function (toFreeze) {
		'use strict';
		Object.freeze(toFreeze);

		Object.getOwnPropertyNames(toFreeze).forEach((prop) => {
			if (toFreeze.hasOwnProperty(prop) && toFreeze[prop] !== null && requiresRecursion(toFreeze, prop)) {
				deepFreeze(toFreeze[prop]);
			}
		});

		return toFreeze;
	};
module.exports = deepFreeze;
