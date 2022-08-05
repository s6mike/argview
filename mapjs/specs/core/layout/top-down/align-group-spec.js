/*global describe, it, expect, require, beforeEach*/
const alignGroup = require('../../../../src/core/layout/top-down/align-group');
describe('alignGroup', function () {
	'use strict';
	let margin;
	beforeEach(() => {
		margin = 10;
	});
	it('centers and compacts the children', function () {
		const idea = {
				id: 5,
				ideas: {
					'-1': { id: 6 },
					1: { id: 7 }
				}
			},
			layout = {
				nodes: {
					5: {width: 10, height: 20, x: -10, y: 10 },
					6: {width: 20, x: -100},
					7: {width: 50, x: 100}
				}
			};
		alignGroup(layout, idea, margin);

		// level = -100 .. 150
		// level width = 250
		// level center = 25
		// compacted child width = 20 + 50 + 10 = 80
		// expected left = 25 - 40 = -15

		expect(layout.nodes[5]).toEqual({width: 80, height: 20, x: -15, y: 10 });
		expect(layout.nodes[6].x).toEqual(-15);
		expect(layout.nodes[7].x).toEqual(15);
	});
	it('sorts nodes from left to right when compacting', function () {
		const idea = {
				id: 5,
				ideas: {
					'-1': { id: 6 },
					1: { id: 7 }
				}
			},
			layout = {
				nodes: {
					5: {width: 10, height: 20, x: -10, y: 10 },
					7: {width: 50, x: 100},
					6: {width: 20, x: -100}
				}
			};
		alignGroup(layout, idea, margin);
		expect(layout.nodes[5]).toEqual({width: 80, height: 20, x: -15, y: 10 });
		expect(layout.nodes[6].x).toEqual(-15);
		expect(layout.nodes[7].x).toEqual(15);

	});
	it('expands the root node to cover its direct children', function () {
		const idea = {
				id: 5,
				ideas: {
					'-1': { id: 6 },
					1: { id: 7 }
				}
			},
			layout = {
				nodes: {
					5: {width: 50, height: 20, x: -10, y: 10 },
					6: {width: 20, x: -100},
					7: {width: 50, x: 100}
				}
			};
		alignGroup(layout, idea, margin);
		expect(layout.nodes[5]).toEqual({width: 80, height: 20, x: -15, y: 10 });
	});
	it('reduces node width if original expectation is larger, when laying out groups', function () {
		const idea = {
				id: 5,
				ideas: {
					'-1': { id: 6 },
					1: { id: 7 }
				}
			},
			layout = {
				nodes: {
					5: {width: 400, height: 20, x: -200, y: 10 },
					6: {width: 20, x: -100},
					7: {width: 50, x: 100}
				}
			};
		alignGroup(layout, idea, margin);
		expect(layout.nodes[5]).toEqual({width: 80, height: 20, x: -15, y: 10 });
	});
	it('does not try to cover grandchildren', function () {
		const idea = {
				id: 5,
				ideas: {
					'-1': { id: 6,
						ideas: {
							1: { id: 8 }
						}
					},
					1: { id: 7 }
				}
			},
			layout = {
				nodes: {
					5: {width: 50, height: 20, x: -10, y: 10 },
					6: {width: 20, x: -100},
					7: {width: 50, x: 100},
					8: {width: 400, x: -200 }
				}
			};
		alignGroup(layout, idea, margin);
		expect(layout.nodes[5]).toEqual({width: 80, height: 20, x: -15, y: 10 });
	});
	it('does not blow up on empty groups', function () {
		const idea = {
				id: 5
			},
			layout = {
				nodes: {
					5: {width: 50, height: 20, x: -10, y: 10 },
					6: {width: 20, x: -100},
					7: {width: 50, x: 100},
					8: {width: 400, x: -200 }
				}
			};
		alignGroup(layout, idea, margin);
		expect(layout.nodes[5]).toEqual({width: 50, height: 20, x: -10, y: 10 });

	});
	it('ignores collapsed groups', function () {
		const idea = {
				'title': 'Mindmup',
				'id': 1,
				'ideas': {
					'2': {
						'title': 'group',
						'id': 7,
						'attr': {
							'contentLocked': true,
							'group': true,
							'collapsed': true
						},
						'ideas': {
							'1': {
								'title': 'inside another group',
								'id': 8,
								'ideas': {}
							}
						}
					},
					'-1': {
						'title': 'outside group',
						'id': 6
					}
				},
				'attr': {
					'theme': 'topdown'
				}
			},
			layout = {
				nodes: {
					1: {width: 50, height: 20, x: -10, y: 10 },
					7: {width: 20, x: -100},
					6: {width: 400, x: -200 }
				}
			};

		alignGroup(layout, idea.ideas[2], margin);
		expect(layout.nodes[6]).toEqual({width: 400, x: -200});
		expect(layout.nodes[7]).toEqual({width: 20, x: -100});

	});
	it('increments vertical offset on nodes within same level', function () {
		const idea = {
				id: 5
			},
			layout = {
				nodes: {
					5: {id: 5, width: 400, height: 20, x: -200, y: 10, level: 1, verticalOffset: 0 },
					6: {id: 6, width: 20, x: -100, level: 1},
					7: {id: 7, width: 50, x: 100, level: 1, verticalOffset: 10}
				}
			};
		alignGroup(layout, idea, margin);
		expect(layout.nodes[5].verticalOffset).toEqual(0);
		expect(layout.nodes[6].verticalOffset).toEqual(20);
		expect(layout.nodes[7].verticalOffset).toEqual(30);
	});
});
