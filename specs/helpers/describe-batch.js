/*global describe, it*/
(function describeBatch() {
	'use strict';
	const oldDescribe = describe;
	describe = function () {
		const optionalBatch = arguments && arguments[1];
		let parameterizedSpec;
		if (arguments.length === 2) {
			return oldDescribe.apply(this, arguments);
		}

		if (arguments.length === 3 && Array.isArray(optionalBatch)) {
			parameterizedSpec = arguments[2];
			oldDescribe.call(this, arguments[0], function () {
				optionalBatch.forEach(function (args) {
					const specArgs = args.slice(1);
					it.call(this, args[0], function () {
						parameterizedSpec.apply(this, specArgs);
					});
				});
			});
		}
	};
}());
