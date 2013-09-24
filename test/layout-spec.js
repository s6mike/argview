/*global describe, expect, it, MAPJS, beforeEach, afterEach*/
describe('calculateLayout', function () {
	'use strict';
	var dimensionProvider = function (text) {
		var length = (text || '').length + 1;
		return {
			width: length * 20,
			height: length * 10
		};
	};
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
			width: 120,
			height: 60,
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
			id: 1,
			ideas: {
				2: { id: 2 },
				3: { id: 3, attr: { style: {something: 'else'} } }
			}
		}),
			result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);
		expect(result.nodes[1].attr.style.background).toBe(MAPJS.defaultStyles.root.background);
		expect(result.nodes[2].attr.style.background).toBe(MAPJS.defaultStyles.nonRoot.background);
		expect(result.nodes[3].attr.style.background).toBe(MAPJS.defaultStyles.nonRoot.background);
		expect(result.nodes[3].attr.style.something).toBe('else');
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
	it('should include links between non-collapsed nodes', function () {
		var contentAggregate = MAPJS.content({
			id: 1,
			title: 'first',
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
				ideaIdTo: 3,
				attr: { name: 'val' }
			}]
		}),
			result;

		result = MAPJS.calculateLayout(contentAggregate, dimensionProvider);

		expect(result.links).toEqual({ '2_3' : { ideaIdFrom : 2, ideaIdTo : 3, attr : { name: 'val' } } });
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
				width: parseInt(parts[0], 10),
				height: parseInt(parts[1], 10)
			};
		};
		describe('Calculating Tree', function () {
			it('should convert a single root node into a tree', function () {
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
			it('should convert a root node with a single child into a tree', function () {
				var content = MAPJS.content({
						id: 1,
						title: '200x100',
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
					title: '200x100',
					width: 200,
					height: 100
				});
				expect(result.subtrees[0]).toPartiallyMatch({
					id: 2,
					title: '300x80',
					width: 300,
					height: 80,
					deltaX: 210,
					deltaY: 10
				});
			});
			it('should disregard children of collapsed nodes', function () {
				var content = MAPJS.content({
						id: 1,
						title: '200x100',
						attr: { collapsed: true},
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
					title: '200x100',
					attr: {collapsed: true},
					width: 200,
					height: 100
				});
				expect(result.subtrees).toBeUndefined();
			});
			it('should convert a root node with a two children into a tree', function () {
				var content = MAPJS.content({
						id: 1,
						title: '200x100',
						ideas: {
							100: {
								id: 2,
								title: '300x80'
							},
							200: {
								id: 3,
								title: '100x30'
							}
						}
					}),
					result;

				result = MAPJS.calculateTree(content, dimensionProvider, 10);

				expect(result).toPartiallyMatch({
					id: 1,
					title: '200x100',
					width: 200,
					height: 100
				});
				expect(result.subtrees[0]).toPartiallyMatch({
					id: 2,
					title: '300x80',
					width: 300,
					height: 80,
					deltaX: 210,
					deltaY: -10
				});
				expect(result.subtrees[1]).toPartiallyMatch({
					id: 3,
					title: '100x30',
					width: 100,
					height: 30,
					deltaX: 210,
					deltaY: 80
				});
			});
			it('should only include nodes where rank and parent predicate says so', function () {
				var content = MAPJS.content({
						id: 11,
						title: '200x100',
						ideas: {
							100: {
								id: 2,
								title: '300x80'
							},
							200: {
								id: 3,
								title: '100x30'
							}
						}
					}),
					result;
				result = MAPJS.calculateTree(content, dimensionProvider, 10, function (rank, parentId) { return parentId !== 11 || rank !== 200; });
				expect(result).toPartiallyMatch({
					id: 11,
					title: '200x100',
					width: 200,
					height: 100
				});
				expect(result.subtrees[0]).toPartiallyMatch({
					id: 2,
					title: '300x80',
					width: 300,
					height: 80,
					deltaX: 210,
					deltaY: 10
				});
				expect(result.subtrees[1]).toBeUndefined();
			});
			describe('manual positioning', function () {
				it('should use manual position on a single child if set as deltaX and deltaY', function () {
					var content = MAPJS.content({
							id: 11,
							title: '200x100',
							ideas: {
								100: {
									id: 2,
									title: '300x80',
									attr: { position: [500, -800] }
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0]).toPartiallyMatch({
						title: '300x80',
						deltaX: 500,
						deltaY: -800
					});
				});
				it('should leave second child where it belongs automatically if only first child has manual position', function () {
					var content = MAPJS.content({
							id: 11,
							title: '200x100',
							ideas: {
								100: {
									id: 2,
									title: '300x80',
									attr: { position: [210, -800] }
								},
								200: {
									id: 3,
									title: '100x30'
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0]).toPartiallyMatch({
						id: 2,
						deltaX: 210,
						deltaY: -800
					});
					expect(result.subtrees[1]).toPartiallyMatch({
						id: 3,
						deltaX: 210,
						deltaY: 80
					});
				});
				it('should push second child down if first child has manual position and would overlap', function () {
					var content = MAPJS.content({
							id: 11,
							title: '200x100',
							ideas: {
								100: {
									id: 2,
									title: '300x80',
									attr: { position: [210, 10] }
								},
								200: {
									id: 3,
									title: '100x30'
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0].deltaY).toBe(10);
					expect(result.subtrees[1].deltaY).toBe(100);
				});
				it('should push first child up if second child has manual position and would overlap', function () {
					var content = MAPJS.content({
							id: 11,
							title: '200x100',
							ideas: {
								100: {
									id: 2,
									title: '300x80',
								},
								200: {
									id: 3,
									title: '100x30',
									attr: { position: [210, 10] }
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0].deltaY).toBe(-80);
					expect(result.subtrees[1].deltaY).toBe(10);
				});
				it('should use child with maximum priority (3rd element in position) to determine alignment if multiple nodes have manual position', function () {
					var content = MAPJS.content({
							id: 11,
							title: '200x100',
							ideas: {
								100: {
									id: 2,
									title: '300x80',
									attr: { position: [210, 5, 2] }
								},
								200: {
									id: 3,
									title: '100x30',
									attr: { position: [210, 10, 0] }
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0].deltaY).toBe(5);
					expect(result.subtrees[1].deltaY).toBe(95);
				});
				it('should take X position into consideration when stacking subtrees', function () {
					var content = MAPJS.content({
							id: 11,
							title: '10x10',
							ideas: {
								100: {
									id: 2,
									title: '50x10',
									attr: { position: [210, -10, 0] },
									ideas: {
										201: {
											id: 4,
											title: '10x100'
										}
									}
								},
								200: {
									id: 3,
									title: '200x10'
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0].deltaY).toBe(-10);
					expect(result.subtrees[1].deltaY).toBe(10);
				});
				it('should compress as much as possible by Y when stacking subtrees with manual positions', function () {
					var content = MAPJS.content({
							id: 11,
							title: '10x10',
							ideas: {
								100: {
									id: 2,
									title: '50x10',
								},
								200: {
									id: 3,
									title: '10x100',
									attr: { position: [210, 10, 0] }
								},
								300: {
									id: 4,
									title: '80x10'
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0].deltaY).toBe(-20);
					expect(result.subtrees[1].deltaY).toBe(10);
					expect(result.subtrees[2].deltaY).toBe(75);
				});
				it('should ignore horisontal positions that would make it overlap with parent', function () {
					var content = MAPJS.content({
							id: 11,
							title: '10x10',
							ideas: {
								100: {
									id: 2,
									title: '50x10',
									attr: { position: [-10, 0, 0] },
								},
								200: {
									id: 3,
									title: '200x10'
								}
							}
						}),
						result;
					result = MAPJS.calculateTree(content, dimensionProvider, 10);
					expect(result.subtrees[0].deltaX).toBe(20);
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
							y: -50,
							width: 200,
							height: 100
						}
					},
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
							y: -50,
							width: 200,
							height: 100,
						},
						'2': {
							id: 2,
							level: 2,
							title: 'First child',
							attr: { name: 'value2' },
							x: 110,
							y: -40,
							width: 300,
							height: 80
						}
					},
					connectors: {
						'2': {
							from: 1,
							to: 2
						}
					}
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
							y: -50,
							width: 200,
							height: 100
						},
						'2': {
							id: 2,
							level: 2,
							title: 'First child',
							attr: { name: 'value2' },
							x: 110,
							y: -60,
							width: 300,
							height: 80
						},
						'3': {
							id: 3,
							level: 2,
							title: 'Second child',
							attr: { name: 'value3' },
							x: 110,
							y: 30,
							width: 100,
							height: 30
						}
					},
					connectors: {
						'2': {
							from: 1,
							to: 2
						},
						'3': {
							from: 1,
							to: 3
						}

					}
				});
			});
		});
	});
	describe('Outline', function () {
		var dimensionProviderResults, dimensionProvider;
		beforeEach(function () {
			dimensionProvider = function (content) {
				var parts = content.title.split('x');
				return {
					width: parseInt(parts[0], 10),
					height: parseInt(parts[1], 10)
				};
			};
		});
		it('should create an outline from a single idea', function () {
			var result, content = MAPJS.content({ title: '20x10' });

			result = MAPJS.Outline.fromDimensions(dimensionProvider(content));

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

		});
		it('should be calculate spacing between simple outlines', function () {
			var outline1 = new MAPJS.Outline([{ h: -35, l: 50}], [{ h: 35, l: 50}]),
				outline2 = new MAPJS.Outline([{ h: -40, l: 120}], [{ h: 40, l: 120}]),
				result;

			result = outline1.spacingAbove(outline2);

			expect(result).toBe(75);
		});
		it('should calculate spacing between more complex outlines', function () {

			var outline1 = new MAPJS.Outline([{"h": -17, "l": 23}, {"l": 123, "h": -17}], [{"h": 17, "l": 23}, {"l": 123, "h": 17}]),
				outline2 = new MAPJS.Outline([{"h": -17, "l": 107}, {"l": 33, "h": -39}], [{"h": 17, "l": 107}, {"l": 33, "h": 39}]),
				result = outline1.spacingAbove(outline2);

			expect(result).toBe(56);
		});
		it('should calculate spacing between even more complex outlines', function () {
			var outline1 = new MAPJS.Outline([{
                "h": -17,
                "l": 57.5
              },
              {
                "l": 107.5,
                "h": -71
              },
              {
                "l": 85,
                "h": 37
              }
            ], [
              {
                "h": 17,
                "l": 57.5
              },
              {
                "l": 192.5,
                "h": 71
              }
            ]),
				outline2 = new MAPJS.Outline([
          {
            "h": -17,
            "l": 30
          },
          {
            "l": 50,
            "h": -17
          }
        ], [
          {
            "h": 17,
            "l": 30
          },
          {
            "l": 50,
            "h": 17
          }
        ]),				
				result = outline1.spacingAbove(outline2);

			expect(result).toBe(88);
		});
		describe('borderLength', function () {
			it('should calculate length of a border', function () {
				var result;

				result = MAPJS.Outline.borderLength([{ l: 100, h: -10 }, { l: 200, h: -50 }]);

				expect(result).toBe(300);
			});
		});
		describe('indent', function () {
			it('should indent the outline by inserting a thin line in the middle at the start', function () {
				var outline = new MAPJS.Outline([{ h: -40, l: 120}, { h: -20, l: 20}], [{ h: 40, l: 100}, {h: 20, l: 20}]),
					result;

				result = outline.indent(11, 8);

				expect(result.top).toEqual([{h: -4, l: 11}, { h: -40, l: 120}, { h: -20, l: 20}]);
				expect(result.bottom).toEqual([{h: 4, l: 11}, { h: 40, l: 100}, {h: 20, l: 20}]);
			});
			it('should center the inserted line based on initial height', function () {
				var outline = new MAPJS.Outline([{ h: -40, l: 120}, { h: -20, l: 20}], [{ h: -20, l: 100}, {h: 20, l: 20}]),
					result;

				result = outline.indent(11, 8);

				expect(result.top).toEqual([{h: -34, l: 11}, { h: -40, l: 120}, { h: -20, l: 20}]);
				expect(result.bottom).toEqual([{h: -26, l: 11}, { h: -20, l: 100}, {h: 20, l: 20}]);
			});
		});
		describe('insertAtStart', function () {
			it('should add a box at the start of an outline, and extend the existing outline by a margin', function () {
				var outline2 = new MAPJS.Outline([{ h: -40, l: 120}], [{ h: 40, l: 120}]),
					result;

				result = outline2.insertAtStart({width: 30, height: 100}, 10);

				expect(result.top).toEqual([{ h: -50, l: 30}, { h: -40, l: 130}]);
				expect(result.bottom).toEqual([{ h: 50, l: 30}, {h: 40, l: 130}]);

			});
			it('does not move the outline vertically (regression check)', function () {
				var outline2 = new MAPJS.Outline([{ h: -4, l: 120}], [{ h: 30, l: 120}]),
					result;

				result = outline2.insertAtStart({width: 30, height: 100}, 10);

				expect(result.top).toEqual([{ h: -50, l: 30}, { h: -4, l: 130}]);
				expect(result.bottom).toEqual([{ h: 50, l: 30}, {h: 30, l: 130}]);

			});
			it('shortens the initial box into 1/2 and expands the outline if outline is taller than box', function () {
				var outline2 = new MAPJS.Outline([{ h: -40, l: 120}], [{ h: 40, l: 120}]),
					result;

				result = outline2.insertAtStart({width: 30, height: 20}, 10);

				expect(result.top).toEqual([{ h: -10, l: 15},  { h: -40, l: 145}]);
				expect(result.bottom).toEqual([{ h: 10, l: 15}, {h: 40, l: 145}]);
			});
		});
		describe('borderSegmentIndexAt',
			[
				['returns element at length if exists', [{ l: 50, h: -10 }, { l: 100, h: -30 }], 70, 1],
				['returns -1 if too short', [{ l: 50, h: -10 }, { l: 100, h: -30 }], 151, -1],
				['returns right segment if on spot', [{ l: 50, h: -10 }, { l: 100, h: -30 }], 50, 1],
				['returns initial segment if length 0', [{ l: 50, h: -10 }, { l: 100, h: -30 }], 0, 0],
				['returns -1 on right border', [{ l: 50, h: -10 }, { l: 100, h: -30 }], 150, -1]
			],
			function (border, length, expected) {
				var result;

				result = MAPJS.Outline.borderSegmentIndexAt(border, length);

				expect(result).toBe(expected);
			});
		describe('extending borders',
			[
				['should preserve first border if second is shorter', [{h: -10, l: 3}], [{h: -20, l: 1}], [{h: -10, l: 3}]],
				['should preserve total length when first border is shorter', [{h: -30, l: 12}], [{h: -10, l: 6}, {h: -20, l: 8}], [{h: -30, l: 12}, {h:  -20, l:  2}]],
				['should preserve extend with segment of second border if second is longer', [{h: -10, l: 3}], [{h: -20, l: 5}], [{h: -10, l: 3}, {h:  -20, l: 2}]],
				['should skip second border elements before end of first border', [{h: -10, l: 3}], [{h: -20, l: 1}, {h:  -30, l:  4}], [{h: -10, l: 3}, {h:  -30, l: 2}]],
				['should skip second border elements aligned with the end of first border', [{h: -10, l: 3}], [{h: -20, l: 3}, {h:  -30, l:  4}], [{h: -10, l: 3}, {h:  -30, l: 4}]],
				['should skip second border elements aligned with the end of first border', [{h: -10, l: 1}, {h: -20, l: 2}, {h: -30, l: 3}], [{h: -20, l: 4}, {h:  -30, l:  3}, {h:  -50, l:  5 }], [{h: -10, l: 1}, {h:  -20, l: 2}, {h:  -30, l:  3}, {h:  -30, l:  1 }, {h:  -50, l: 5 }]],
			],
			function (firstBorder, secondBorder, expected) {
				var result;
				result = MAPJS.Outline.extendBorder(firstBorder, secondBorder);
				expect(result).toEqual(expected);
			});
		describe('expand', function () {
			it('should expand borders so that the initial height matches arguments', function () {
				var outline = new MAPJS.Outline([{h: -10, l: 10}, {h: -110, l: 20}], [{h: 10, l: 10}, {h: 110, l: 20}]),
					result = outline.expand(-50, 33);
				expect(result.top).toEqual([{h: -50, l: 10}, {h: -150, l: 20}]);
				expect(result.bottom).toEqual([{h: 33, l: 10}, {h: 133, l: 20}]);
			});
		});
		it('should calculate spacing between more complex outlines', function () {
			var outline1 = new MAPJS.Outline([], [{ h: 5, l: 6}, { h: 15, l: 8 }]),
				outline2 = new MAPJS.Outline([{ h: -10, l: 12}], []),
				result;

			result = outline1.spacingAbove(outline2);

			expect(result).toBe(25);

		});
		it('should be able to stack simple outlines', function () {
			var outline1 = new MAPJS.Outline([{ h: -35, l: 50}], [{ h: 35, l: 50}]),
				outline2 = new MAPJS.Outline([{ h: -40, l: 120}], [{ h: 40, l: 120}]),
				result;

			result = outline2.stackBelow(outline1, 10);

			expect(result.borders()).toEqual({
				top: [{ h: -35, l: 50}, {h: 45, l: 70}],
				bottom: [{h: 125, l: 120}]
			});
		});
		it('should be able to stack outlines with more complex borders', function () {
			var outline1 = new MAPJS.Outline([{ h: -5, l: 6}, {h: -15, l: 8}], [{h: 5, l: 6}, {h: 15, l: 8}]),
				outline2 = new MAPJS.Outline([{ h: -10, l: 12}], [{ h: 10, l: 12}]),
				result;

			result = outline2.stackBelow(outline1, 10);

			expect(result.borders()).toEqual({
				top: [{ h: -5, l: 6}, {h: -15, l: 8}],
				bottom: [{h: 45, l: 12}, {h: 15, l: 2}]
			});
		});
		it('should be able to stack outlines with more complex borders', function () {
			var outline1 = new MAPJS.Outline([{
                "h": -17,
                "l": 57.5
              },
              {
                "l": 107.5,
                "h": -71
              },
              {
                "l": 85,
                "h": 37
              }
            ], [
              {
                "h": 17,
                "l": 57.5
              },
              {
                "l": 192.5,
                "h": 71
              }
            ]),
				outline2 = new MAPJS.Outline([
          {
            "h": -17,
            "l": 30
          },
          {
            "l": 50,
            "h": -17
          }
        ], [
          {
            "h": 17,
            "l": 30
          },
          {
            "l": 50,
            "h": 17
          }
        ]),
				result;

			result = outline2.stackBelow(outline1, 10);

			expect(result.borders()).toEqual({
				top : [ { h : -17, l : 57.5 }, { l : 107.5, h : -71 }, { l : 85, h : 37 } ], bottom : [ { l : 30, h : 115 }, { l : 50, h : 115 }, { h : 71, l : 170 } ]
			});

			//
		});
	});
});
