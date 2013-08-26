/*global describe, expect, it, MAPJS*/
describe('layout', function () {
	'use strict';
	var dimensionProvider = function (text) {
		var length = (text || '').length + 1;
		return {
			width: length * 20,
			height: length * 10
		};
	};
	describe('Calculating dimensions', function () {
		it('should return two margins plus text width/height as dimensions of a single idea', function () {
			var contentAggregate = MAPJS.content({
					id: 7,
					title: '1'
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result).toEqual({
				id: 7,
				title: '1',
				width: 60,
				height: 40,
				Width: 60,
				Height: 40,
				WidthLeft: 0
			});
		});
		it('should return (width1 + width2 + 4 * margin, max(height1, height2) + 2 * margin)', function () {
			var contentAggregate = MAPJS.content({
					id: 7,
					title: '1',
					ideas: {
						1: {
							id: 8,
							title: '11'
						}
					}
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result).toEqual({
				id: 7,
				title: '1',
				width: 60,
				height: 40,
				Width: 140,
				Height: 50,
				WidthLeft: 0,
				ideas: {
					1: {
						id: 8,
						title: '11',
						width: 80,
						height: 50,
						Width: 80,
						Height: 50,
						WidthLeft: 0
					}
				}
			});
		});
		it('should disregard children of collapsed nodes', function () {
			var contentAggregate = MAPJS.content({
					id: 7,
					title: '1',
					attr: { collapsed: true },
					ideas: {
						1: {
							id: 8,
							title: '11'
						}
					}
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result).toPartiallyMatch({
				id: 7,
				Width: 60,
				Height: 40,
				WidthLeft: 0,
				attr: {collapsed: true}
			});
		});
		it('', function () {
			var contentAggregate = MAPJS.content({
					id: 7,
					title: '7',
					ideas: {
						'-1': {
							id: 8,
							title: '8'
						},
						1: {
							id: 9,
							title: '9'
						}
					}
				}),
				result = MAPJS.calculateDimensions(contentAggregate, dimensionProvider, 10);
			expect(result.Width).toBe(180);
		});
	});
	describe('Calculating positions', function () {
		it('', function () {
			var contentAggregate = MAPJS.content({
					id: 7,
					title: '1'
				}),
				result = MAPJS.calculatePositions(contentAggregate, dimensionProvider, 10, 0, 0);
			expect(result).toEqual({
				id: 7,
				title: '1',
				x: 10,
				y: 10,
				width: 60,
				height: 40,
				Width: 60,
				Height: 40,
				WidthLeft: 0
			});
		});
		it('', function () {
			var contentAggregate = MAPJS.content({
					id: 7,
					title: '1',
					ideas: {
						1: {
							id: 8,
							title: '11'
						}
					}
				}),
				result = MAPJS.calculatePositions(contentAggregate, dimensionProvider, 10, 0, 0);
			expect(result).toEqual({
				id: 7,
				title: '1',
				x: 10,
				y: 15,
				width: 60,
				height: 40,
				Width: 140,
				Height: 50,
				WidthLeft: 0,
				ideas: {
					1: {
						id: 8,
						title: '11',
						x: 70,
						y: 10,
						width: 80,
						height: 50,
						Width: 80,
						Height: 50,
						WidthLeft: 0
					}
				}
			});
		});
	});
	it('should assign root node level 1', function () {
		var contentAggregate = MAPJS.content({ id: 7 }),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7].level).toEqual(1);
	});
	it('should assign child node levels recursively', function () {
		var contentAggregate = MAPJS.content({
				id: 7,
				ideas: {
					1: {
						id: 2,
						ideas: {
							1: {
								id: 22
							}
						}
					},
					2: {
						id: 3
					}
				}
			}),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7].level).toEqual(1);
		expect(result.nodes[2].level).toEqual(2);
		expect(result.nodes[22].level).toEqual(3);
		expect(result.nodes[3].level).toEqual(2);
	});
	it('should place a root node on (margin, margin)', function () {
		var contentAggregate = MAPJS.content({
				id: 7,
				title: 'Hello'
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7]).toPartiallyMatch({
			id: 7,
			x: -60,
			y: -30,
			width: 140,
			height: 80,
			title: 'Hello',
			level: 1
		});
	});
	it('should place root node left of its only right child', function () {
		var contentAggregate = MAPJS.content({
				id: 7,
				title: '1',
				ideas: {
					1: {
						id: 8,
						title: '12'
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[7]).toPartiallyMatch({
			x: -20,
			y: -10
		});
		expect(result.nodes[8]).toPartiallyMatch({
			x: 40,
			y: -15
		});
	});
	it('should place root node right of its only left child', function () {
		var contentAggregate = MAPJS.content({
				id: 7,
				title: '1',
				ideas: {
					1: {
						id: 8,
						title: '12'
					},
					'-1': {
						id: 9,
						title: '123'
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[9]).toPartiallyMatch({
			x: -120,
			y: -20
		});
	});
	it('should work recursively', function () {
		var contentAggregate = MAPJS.content({
				id: 7,
				title: '1',
				ideas: {
					1: {
						id: 8,
						title: '12'
					},
					'-1': {
						id: 9,
						title: '123',
						ideas: {
							3: {
								id: 10,
								title: '1234'
							}
						}
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[10].x).toBe(-240);
	});
	it('should place child nodes below each other', function () {
		var contentAggregate = MAPJS.content({
				id: 7,
				title: '1',
				ideas: {
					2: {
						id: 8,
						title: '12'
					},
					1: {
						id: 9,
						title: '123'
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[9].y).toBe(-45);
		expect(result.nodes[8].y).toBe(15);
	});
	it('should center children vertically', function () {
		var contentAggregate = MAPJS.content({
				id: 10,
				title: '123',
				ideas: {
					'-2': {
						id: 11,
						title: ''
					}
				}
			}),
			result;
		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[11].y).toBe(-5);
	});
	it('should copy style to nodes', function () {
		var contentAggregate = MAPJS.content({
			title: '123',
			attr: { collapsed: true, style: { background: '#FFFFFF'}}
		}),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[1]).toPartiallyMatch({
			attr: {collapsed: true, style: { background: '#FFFFFF'}}
		});
	});
	it('should set style using defaults where not defined', function () {
		var contentAggregate = MAPJS.content({
			title: '123',
			attr: { collapsed: true}
		}),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[1].attr.style.background).not.toBeUndefined();
	});
	it('should not include links between collapsed nodes', function () {
		var contentAggregate = MAPJS.content({
			id: 1,
			title: 'first',
			attr: { collapsed: true },
			ideas: {
				100: {
					id: 2,
					title: 'second'
				},
				200: {
					id: 3,
					title: 'third'
				}
			},
			links: [{
				ideaIdFrom: 2,
				ideaIdTo: 3
			}]
		}),
			result;

		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);

		expect(result.links).toEqual([]);
	});
});
describe('MAPJS.frame', function () {
	'use strict';
	it('should set origin.y to be the minimum y', function () {
		var nodes = [{x: -10, y: 5, width: 10, height: 55}, {x: 1, y: -12, width: 15, height: 30}],
			result = MAPJS.calculateFrame(nodes, 5);
		expect(result).toPartiallyMatch({top: -17, left: -15, width: 36, height: 82});
	});
});
describe('New layout', function () {
	'use strict';
	describe('Tree', function () {
		var dimensionProvider = function (content) {
			var parts = content.title.split('x');
			return {
				width: parseInt(parts[0]),
				height: parseInt(parts[1])
			};
		}
		describe('Calculating Tree', function () {
			it ('should convert a single root node into a tree', function () {
				var content = MAPJS.content({
						id: 1,
						title: '100x200',
						attr: { name: 'value' }
					}),
					result;

				result = MAPJS.calculateTree(content, dimensionProvider);

				expect(result).toPartiallyMatch({
					id: 1,
					title: '100x200',
					attr: { name: 'value' },
					width: 100,
					height: 200
				});
			});
			it ('should convert a root node with a single child into a tree', function () {
				var content = MAPJS.content({
						id: 1,
						title: '100x200',
						ideas: {
							100: {
								id: 2,
								title: '300x80'
							}
						}
					}),
					result;

				result = MAPJS.calculateTree(content, dimensionProvider, 10);

				expect(result).toPartiallyMatch({
					id: 1,
					title: '100x200',
					width: 100,
					height: 200
				});
				expect(result.subtrees[0]).toPartiallyMatch({
					id: 2,
					title: '300x80',
					width: 300,
					height: 80,
					deltaX: 110,
					deltaY: 60
				});
			});
		});
		describe('conversion to layout', function () {
			it('should calculate the layout for a single node', function () {
				var tree = new MAPJS.Tree({
					id: 1,
					title: 'Hello world',
					attr: { name: 'value' },
					width: 200,
					height: 100
				}), result;

				result = tree.toLayout();

				expect(result).toEqual({
					nodes: {
						'1': {
							id: 1,
							level: 1,
							title: 'Hello world',
							attr: { name: 'value' },
							x: -100,
							y: -50
						}
					},
					links: {},
					connectors: {}
				});
			});
			it('should calculate the layout for two nodes', function () {
				var tree = new MAPJS.Tree({
					id: 1,
					title: 'Hello world',
					attr: { name: 'value' },
					width: 200,
					height: 100,
					subtrees: [
						new MAPJS.Tree({
							id: 2,
							title: 'First child',
							attr: { name: 'value2' },
							width: 300,
							height: 80,
							deltaX: 210,
							deltaY: 10
						})
					]
				}), result;

				result = tree.toLayout();

				expect(result).toEqual({
					nodes: {
						'1': {
							id: 1,
							level: 1,
							title: 'Hello world',
							attr: { name: 'value' },
							x: -100,
							y: -50
						},
						'2': {
							id: 2,
							level: 2,
							title: 'First child',
							attr: { name: 'value2' },
							x: 110,
							y: -40
						}
					},
					links: {},
					connectors: {}
				});

			});
			it('should calculate the layout for two left-aligned sub child nodes', function () {
				var tree = new MAPJS.Tree({
					id: 1,
					title: 'Hello world',
					attr: { name: 'value' },
					width: 200,
					height: 100,
					subtrees: [
						new MAPJS.Tree({
							id: 2,
							title: 'First child',
							attr: { name: 'value2' },
							width: 300,
							height: 80,
							deltaX: 210,
							deltaY: -10
						}), 
						new MAPJS.Tree({
							id: 3,
							title: 'Second child',
							attr: { name: 'value3' },
							width: 100,
							height: 30,
							deltaX: 210,
							deltaY: 80
						})
					]
				}), result;

				result = tree.toLayout();

				expect(result).toEqual({
					nodes: {
						'1': {
							id: 1,
							level: 1,
							title: 'Hello world',
							attr: { name: 'value' },
							x: -100,
							y: -50
						},
						'2': {
							id: 2,
							level: 2,
							title: 'First child',
							attr: { name: 'value2' },
							x: 110,
							y: -60
						},
						'3': {
							id: 3,
							level: 2,
							title: 'Second child',
							attr: { name: 'value3' },
							x: 110,
							y: 30
						}
					},
					links: {},
					connectors: {}
				});
			});
		})
	});
	describe('Outline', function () {
		var dimensionProviderResults, dimensionProvider;
		beforeEach(function () {
			dimensionProvider = function (content) {
				var parts = content.title.split('x');
				return {
					width: parseInt(parts[0]),
					height: parseInt(parts[1])
				};
			};
		});
		it('should create an outline from a single idea', function () {
			var result, content = MAPJS.content({ title: '20x10' });

			result = MAPJS.calculateOutline(content, dimensionProvider);

			expect(result.borders()).toEqual({
				top: [{
					h: -5,
					l: 20
				}],
				bottom: [{
					h: 5,
					l: 20
				}]
			});
			expect(result.subOutlines()).toEqual([]);
		});
		it('should create an outline from an idea with one child node', function () {
			var result, content = MAPJS.content({
				title: '100x200',
				id: 66,
				ideas: {
					100: {
						title: '50x70',
						id: 99
					}
				}
			});

			result = MAPJS.calculateOutline(content, dimensionProvider);

			expect(result.borders()).toEqual({
				top: [{
					h: -100,
					l: 100
				}, {
					h: -35,
					l: 60
				}],
				bottom: [{
					h: 100,
					l: 100
				}, {
					h: 35,
					l: 60
				}]
			});
		});
		it('should be calculate spacing between simple outlines', function () {
			var outline1 = new MAPJS.Outline([{ h: -35, l: 50}], [{ h: 35, l: 50}]),
				outline2 = new MAPJS.Outline([{ h: -40, l: 120}], [{ h: 40, l: 120}]),
				result;

			result = outline1.spacingAbove(outline2);

			expect(result).toBe(75);
		});
		it('should be able to stack outlines', function () {
			var outline1 = new MAPJS.Outline([{ h: -35, l: 50}], [{ h: 35, l: 50}]),
				outline2 = new MAPJS.Outline([{ h: -40, l: 120}], [{ h: 40, l: 120}]),
				result;

			result = outline2.stackBelow(outline1, 10);

			expect(result.borders()).toEqual({
				top: [{
					h: -80,
					l: 50
				}],
				bottom: [{
					h: 80,
					l: 120
				}]
			});
		});
		it('should create an outline', function () {
			var result, content = MAPJS.content({
				title: '100x200',
				ideas: {
					100: {
						title: '50x70'
					},
					200: {
						title: '120x80'
					}
				}
			});

			result = MAPJS.calculateOutline(content, dimensionProvider);

			expect(result.borders()).toEqual({
				top: [{
					h: -100,
					l: 100
				}, {
					h: -80,
					l: 60
				}],
				bottom: [{
					h: 100,
					l: 100
				}, {
					h: 80,
					l: 130
				}]
			});
		});
	});
});
