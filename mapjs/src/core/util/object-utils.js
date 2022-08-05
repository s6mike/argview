/*global module*/
const getValue = (hashmap, attributeNameComponents) => {
		'use strict';
		if (!hashmap || !attributeNameComponents || !attributeNameComponents.length || typeof hashmap !== 'object' || !Array.isArray(attributeNameComponents)) {
			return false;
		}
		const val = hashmap[attributeNameComponents[0]],
			remaining = attributeNameComponents.slice(1);
		if (remaining.length) {
			return getValue(val, remaining);
		}
		return val;
	},
	setValue = (hashmap, attributeNameComponents, value) => {
		'use strict';
		if (!hashmap || !attributeNameComponents || !attributeNameComponents.length || typeof hashmap !== 'object' || !Array.isArray(attributeNameComponents)) {
			return false;
		}
		const remaining = attributeNameComponents.slice(1),
			currentKey = attributeNameComponents[0];

		if (remaining.length) {
			if (!hashmap[currentKey]) {
				if (!value) {
					return;
				}
				hashmap[currentKey] = {};
			}
			setValue(hashmap[currentKey], remaining, value);
			return;
		}
		if (!value) {
			delete hashmap[currentKey];
		} else {
			hashmap[currentKey] = value;
		}
	},
	keyComponentsWithValue = (hashmap, searchingFor) => {
		'use strict';
		if (typeof searchingFor === 'object' || Array.isArray(searchingFor)) {
			throw 'search-type-not-supported';
		}
		const result = [];
		if (!hashmap || typeof hashmap !== 'object') {
			return [];
		}
		Object.keys(hashmap).forEach((key) => {
			const val = hashmap[key];
			if (val === searchingFor) {
				result.push([key]);
			}
			if (typeof val === 'object') {
				keyComponentsWithValue(val, searchingFor).forEach((subKey) => {
					if (!subKey || !subKey.length) {
						return;
					}
					const newComps = [key].concat(subKey);
					result.push(newComps);
				});
			}
		});
		return result;
	};

module.exports = {
	getValue: getValue,
	setValue: setValue,
	keyComponentsWithValue: keyComponentsWithValue
};
