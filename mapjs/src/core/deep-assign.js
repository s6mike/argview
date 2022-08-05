/*global module, require*/
const isObjectObject = require('./is-object-object'),
	isNotRecursableObject = value => {
		'use strict';
		return !isObjectObject(value);
	};
module.exports = function deepAssign() {
	'use strict';
	const args = Array.prototype.slice.call(arguments, 0),
		assignee = (args && args[0]),
		assigners = (args && args.length > 1 && args.slice(1)) || [];
	if (!assignee || args.find(isNotRecursableObject)) {
		throw new Error('invalid-args');
	}
	assigners.forEach(assigner => {
		Object.keys(assigner)
		.forEach(key => {
			if (isObjectObject(assigner[key]) && isObjectObject(assignee[key])) {
				assignee[key] = deepAssign({}, assignee[key], assigner[key]);
			} else if (isObjectObject(assigner[key])) {
				assignee[key] = deepAssign({}, assigner[key]);
			} else {
				assignee[key] = assigner[key];
			}

		});
	});
	return assignee;
};
