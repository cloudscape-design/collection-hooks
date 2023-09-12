// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, render as testRender } from '@testing-library/react';
import * as React from 'react';
import { useCollection } from '../';
import { PropertyFilterProperty, TrackBy } from '../interfaces';
import { Demo, Item, render } from './stubs';

const generateItems = (length: number) =>
  Array.from({ length }, (_, index) => ({ id: `${index + 1}` })) as ReadonlyArray<Item>;

test('displays correct counts when filtering and pagination applied', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      filtering: { defaultFilteringText: '1' },
      pagination: {},
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems, getMatchesCount, getPagesCount } = render(<App />);
  expect(getVisibleItems()).toHaveLength(10);
  expect(getMatchesCount()).toEqual('14');
  expect(getPagesCount()).toEqual('2');
});

test('should react to filtering change', () => {
  const allItems = [
    { id: '1', value: 'match me' },
    { id: '2', value: 'not me' },
    { id: '3', value: 'not me' },
    { id: '4', value: 'match me' },
  ];
  function App() {
    const result = useCollection<Item>(allItems, {
      filtering: {},
    });
    return <Demo {...result} />;
  }
  const { findFilterInput, getVisibleItems } = render(<App />);
  expect(getVisibleItems()).toHaveLength(4);
  fireEvent.change(findFilterInput(), { target: { value: 'match' } });
  expect(getVisibleItems()).toHaveLength(2);
  fireEvent.change(findFilterInput(), { target: { value: '' } });
  expect(getVisibleItems()).toHaveLength(4);
});

test('should render empty state when there are no items', () => {
  function App() {
    const result = useCollection<Item>([], {
      filtering: {
        empty: 'No items to display',
        noMatch: "We can't find a match",
      },
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems, findEmptySlot } = render(<App />);
  expect(getVisibleItems()).toHaveLength(0);
  expect(findEmptySlot()!.textContent).toEqual('No items to display');
});

test('should render no match state when there are items, but they are filtered out', () => {
  const allItems = [
    { id: '1', value: 'first' },
    { id: '2', value: 'second' },
  ];
  function App() {
    const result = useCollection<Item>(allItems, {
      filtering: {
        empty: 'No items to display',
        noMatch: "We can't find a match",
      },
    });
    return <Demo {...result} />;
  }
  const { findFilterInput, getVisibleItems, findEmptySlot } = render(<App />);
  expect(getVisibleItems()).toHaveLength(2);
  expect(findEmptySlot()).toBeNull();
  fireEvent.change(findFilterInput(), { target: { value: 'test' } });
  expect(getVisibleItems()).toHaveLength(0);
  expect(findEmptySlot()!.textContent).toEqual("We can't find a match");
});

test('should reset current page when filtering or sorting changes', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      filtering: { defaultFilteringText: '1' },
      pagination: { defaultPage: 2 },
      sorting: {},
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems, findFilterInput, getCurrentPage, findSortBy, findNextPage } = render(<App />);
  expect(getVisibleItems()).toEqual(['19', '21', '31', '41']);
  expect(findFilterInput().value).toEqual('1');
  expect(getCurrentPage()).toEqual('2');
  fireEvent.change(findFilterInput(), { target: { value: '3' } });
  expect(getVisibleItems()).toEqual(['3', '13', '23', '30', '31', '32', '33', '34', '35', '36']);
  expect(findFilterInput().value).toEqual('3');
  expect(getCurrentPage()).toEqual('1');
  fireEvent.click(findNextPage());
  expect(getCurrentPage()).toEqual('2');
  fireEvent.click(findSortBy());
  expect(getVisibleItems()).toEqual(['13', '23', '3', '30', '31', '32', '33', '34', '35', '36']);
  expect(getCurrentPage()).toEqual('1');
});

test('should update total pages count when filtering changes', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      filtering: {},
      pagination: {},
    });
    return <Demo {...result} />;
  }
  const { findFilterInput, getPagesCount } = render(<App />);
  expect(getPagesCount()).toEqual('5');
  fireEvent.change(findFilterInput(), { target: { value: '3' } });
  expect(getPagesCount()).toEqual('2');
  fireEvent.change(findFilterInput(), { target: { value: '' } });
  expect(getPagesCount()).toEqual('5');
});

test('should react to pagination changes', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      pagination: {},
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems, getCurrentPage, getPagesCount, findNextPage, findPreviousPage } = render(<App />);
  expect(getCurrentPage()).toEqual('1');
  expect(getPagesCount()).toEqual('5');
  expect(getVisibleItems()[0]).toEqual('1');
  fireEvent.click(findNextPage());
  expect(getCurrentPage()).toEqual('2');
  expect(getPagesCount()).toEqual('5');
  expect(getVisibleItems()[0]).toEqual('11');
  fireEvent.click(findPreviousPage());
  expect(getCurrentPage()).toEqual('1');
  expect(getPagesCount()).toEqual('5');
  expect(getVisibleItems()[0]).toEqual('1');
});

test('should prevent pagination from going out of bounds', () => {
  const allItems = generateItems(20);
  function App() {
    const result = useCollection(allItems, {
      pagination: {},
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems, getCurrentPage, findNextPage, findPreviousPage } = render(<App />);
  expect(getCurrentPage()).toEqual('1');
  expect(getVisibleItems()[0]).toEqual('1');
  fireEvent.click(findPreviousPage());
  expect(getCurrentPage()).toEqual('1');
  expect(getVisibleItems()[0]).toEqual('1');
  fireEvent.click(findNextPage());
  expect(getCurrentPage()).toEqual('2');
  expect(getVisibleItems()[0]).toEqual('11');
  fireEvent.click(findNextPage());
  expect(getCurrentPage()).toEqual('1');
  expect(getVisibleItems()[0]).toEqual('1');
});

test('should evoke scrollToTop from the ref on pagination, filtering, property filtering and sorting', () => {
  const allItems = generateItems(50);
  const spy = jest.fn();
  function App() {
    const result = useCollection(allItems, {
      pagination: {},
      sorting: {},
    });
    return <Demo {...result} spy={spy} />;
  }
  const { findNextPage, findCurrentPage, findSortBy, findFilterInput, findPropertyFilterChange } = render(<App />);
  fireEvent.click(findNextPage());
  expect(spy).toHaveBeenCalled();
  spy.mockReset();
  fireEvent.click(findCurrentPage());
  expect(spy).toHaveBeenCalled();
  spy.mockReset();
  fireEvent.click(findSortBy());
  expect(spy).toHaveBeenCalled();
  spy.mockReset();
  fireEvent.change(findFilterInput(), { target: { value: 'match' } });
  expect(spy).toHaveBeenCalled();
  spy.mockReset();
  fireEvent.click(findPropertyFilterChange());
  expect(spy).toHaveBeenCalled();
});

describe('keepSelection = false', () => {
  test('should reset the selection on pagination', () => {
    const allItems = generateItems(50);
    function App() {
      const result = useCollection(allItems, {
        pagination: {},
        selection: {
          defaultSelectedItems: [allItems[0]],
        },
      });
      return <Demo {...result} />;
    }
    const { findNextPage, findPreviousPage, findCurrentPage, findItem, getSelectedItems, getSelectedLength } = render(
      <App />
    );
    expect(getSelectedItems()).toEqual(['1']);
    fireEvent.click(findNextPage());
    expect(getSelectedLength()).toEqual('0');
    fireEvent.click(findPreviousPage());
    fireEvent.click(findItem(0));
    expect(getSelectedItems()).toEqual(['1']);
    fireEvent.click(findCurrentPage());
    expect(getSelectedItems()).toEqual(['1']);
  });

  test('should reset the selection when filtering', () => {
    const allItems = generateItems(50);
    function App() {
      const result = useCollection(allItems, {
        pagination: {},
        filtering: {},
        selection: {
          defaultSelectedItems: [allItems[0]],
        },
      });
      return <Demo {...result} />;
    }
    const { findFilterInput, getSelectedLength } = render(<App />);
    expect(getSelectedLength()).toEqual('1');
    fireEvent.change(findFilterInput(), { target: { value: '2' } });
    expect(getSelectedLength()).toEqual('0');
    fireEvent.change(findFilterInput(), { target: { value: '' } });
    expect(getSelectedLength()).toEqual('0');
  });

  test('should reset the selection when sorting', () => {
    const allItems = generateItems(50);
    const App = ({ items }: { items: readonly Item[] }) => {
      const result = useCollection(items, {
        pagination: {},
        sorting: {},
        selection: {
          defaultSelectedItems: [allItems[4]],
        },
      });
      return <Demo {...result} />;
    };
    const { findSortBy, getSelectedLength } = render(<App items={allItems} />);
    expect(getSelectedLength()).toEqual('1');
    fireEvent.click(findSortBy());
    expect(getSelectedLength()).toEqual('0');
    fireEvent.click(findSortBy());
    expect(getSelectedLength()).toEqual('0');
  });

  test('"reacts" to `allItems` updates: filters out items, that are not in the updated `allItems`', () => {
    const allItems = generateItems(50);
    const App = ({ items }: { items: readonly Item[] }) => {
      const result = useCollection(items, {
        pagination: {},
        sorting: {},
        selection: {
          defaultSelectedItems: [allItems[0]],
        },
      });
      return <Demo {...result} />;
    };
    const { getSelectedLength, rerender } = render(<App items={allItems} />);
    expect(getSelectedLength()).toEqual('1');
    rerender(<App items={allItems.slice(1)} />);
    expect(getSelectedLength()).toEqual('0');
    rerender(<App items={allItems} />);
    expect(getSelectedLength()).toEqual('0');
  });

  test('should use trackBy to prevent unnecessary re-renders', () => {
    function App() {
      const allItems = generateItems(50);
      const result = useCollection(allItems, {
        pagination: {},
        selection: {
          defaultSelectedItems: [allItems[0]],
          trackBy: 'id',
        },
      });
      return <Demo {...result} />;
    }
    const { findItem, getSelectedItems } = render(<App />);
    expect(getSelectedItems()).toEqual(['1']);
    fireEvent.click(findItem(1));
    expect(getSelectedItems()).toEqual(['2']);
  });
});

test('should not reset the selection on pagination change, with `keepSelection` enabled', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      pagination: {},
      sorting: {},
      selection: {
        defaultSelectedItems: [allItems[0]],
        keepSelection: true,
      },
    });
    return <Demo {...result} />;
  }
  const { findNextPage, findPreviousPage, findCurrentPage, getSelectedItems } = render(<App />);
  expect(getSelectedItems()).toEqual(['1']);
  fireEvent.click(findNextPage());
  fireEvent.click(findPreviousPage());
  expect(getSelectedItems()).toEqual(['1']);
  fireEvent.click(findCurrentPage());
  expect(getSelectedItems()).toEqual(['1']);
});

describe('Property filtering', () => {
  const allItems = generateItems(50);
  const propertyFiltering = {
    filteringProperties: [
      {
        key: 'id',
        operators: [':', '!:', '=', '!='],
        groupValuesLabel: 'Id values',
        propertyLabel: 'Id',
      },
    ],
    empty: 'No items to display',
    noMatch: "We can't find a match",
    defaultQuery: { tokens: [{ propertyKey: 'id', operator: ':', value: '1' }], operation: 'and' },
  } as const;
  test('displays correct counts when used with pagination', () => {
    function App() {
      const result = useCollection(allItems, {
        propertyFiltering,
        pagination: {},
      });
      return <Demo {...result} />;
    }
    const { getVisibleItems, getMatchesCount, getPagesCount } = render(<App />);
    expect(getVisibleItems()).toHaveLength(10);
    expect(getMatchesCount()).toEqual('14');
    expect(getPagesCount()).toEqual('2');
  });

  test('should react to query change', () => {
    function App() {
      const result = useCollection(allItems, {
        propertyFiltering: {
          ...propertyFiltering,
          defaultQuery: {
            tokens: [{ propertyKey: 'id', value: '1', operator: '=' }],
            operation: 'and',
          },
        },
        pagination: {},
      });
      return <Demo {...result} />;
    }
    const { findPropertyFilterChange, getVisibleItems } = render(<App />);
    expect(getVisibleItems()).toHaveLength(1);
    fireEvent.click(findPropertyFilterChange());
    expect(getVisibleItems()).toHaveLength(10);
  });

  test('should render empty state when there are no items', () => {
    function App() {
      const result = useCollection<Item>([], {
        propertyFiltering,
      });
      return <Demo {...result} />;
    }
    const { getVisibleItems, findEmptySlot } = render(<App />);
    expect(getVisibleItems()).toHaveLength(0);
    expect(findEmptySlot()!.textContent).toEqual('No items to display');
  });

  test('should render no match state when there are items, but they are filtered out', () => {
    const items = [
      { id: '3', value: 'third' },
      { id: '4', value: 'fourth' },
    ];
    function App() {
      const result = useCollection<Item>(items, {
        propertyFiltering,
      });
      return <Demo {...result} />;
    }
    const { getVisibleItems, findEmptySlot } = render(<App />);
    expect(getVisibleItems()).toHaveLength(0);
    expect(findEmptySlot()!.textContent).toEqual("We can't find a match");
  });

  test('should reset current page when property filtering changes', () => {
    function App() {
      const result = useCollection(allItems, {
        propertyFiltering,
        pagination: { defaultPage: 2 },
        sorting: {},
      });
      return <Demo {...result} />;
    }
    const { getVisibleItems, findPropertyFilterChange, getCurrentPage } = render(<App />);
    expect(getVisibleItems()).toEqual(['19', '21', '31', '41']);
    expect(getCurrentPage()).toEqual('2');
    fireEvent.click(findPropertyFilterChange());
    expect(getVisibleItems()).toEqual(['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']);
    expect(getCurrentPage()).toEqual('1');
  });

  test('should update total pages count when filtering changes', () => {
    function App() {
      const result = useCollection(allItems, {
        propertyFiltering,
        pagination: {},
      });
      return <Demo {...result} />;
    }
    const { findPropertyFilterChange, getPagesCount } = render(<App />);
    expect(getPagesCount()).toEqual('2');
    fireEvent.click(findPropertyFilterChange());
    expect(getPagesCount()).toEqual('5');
  });

  test('should generate filtering options from the dataset', () => {
    const propertyFiltering = {
      filteringProperties: [
        {
          key: 'id',
          groupValuesLabel: 'Id values',
          propertyLabel: 'Id',
        },
        {
          key: 'date',
          groupValuesLabel: 'Date values',
          propertyLabel: 'Date',
        },
      ],
    } as const;
    const date = new Date('2021-05-18T17:58:08.136Z');
    const stringifiedDate = '' + date;
    function App() {
      const items: Item[] = [{ id: 'one', date }];
      const result = useCollection(items, {
        propertyFiltering,
        pagination: {},
      });
      return <Demo {...result} />;
    }
    const { findPropertyOptions } = render(<App />);
    expect(findPropertyOptions()).toEqual(`idonedate${stringifiedDate}`);
  });

  test('should remove duplicate filtering options', () => {
    const MixedOptions = () => {
      const propertyFiltering = {
        filteringProperties: [
          {
            key: 'property',
            groupValuesLabel: 'Property values',
            propertyLabel: 'Property',
          },
        ],
      } as const;
      const items: { property: string }[] = [{ property: 'a' }, { property: 'a' }];
      const result = useCollection(items, {
        propertyFiltering,
        pagination: {},
      });
      return <>{result.propertyFilterProps.filteringOptions.map(({ value }) => value).join(',')}</>;
    };
    const { container } = testRender(<MixedOptions />);
    expect(container?.textContent?.split(',')).toEqual(['a']);
  });

  test('should not generate filtering options for "falsy" values except boolean false and number zero', () => {
    const MixedOptions = () => {
      const propertyFiltering = {
        filteringProperties: [
          {
            key: 'falsy',
            groupValuesLabel: 'Falsy values',
            propertyLabel: 'Falsy',
          },
        ],
      } as const;
      const items: { falsy?: any }[] = [
        {},
        { falsy: undefined },
        { falsy: null },
        { falsy: '' },
        { falsy: NaN },
        { falsy: false },
        { falsy: 0 },
      ];
      const result = useCollection(items, {
        propertyFiltering,
        pagination: {},
      });
      return <>{result.propertyFilterProps.filteringOptions.map(({ value }) => value).join(',')}</>;
    };
    const { container } = testRender(<MixedOptions />);
    expect(container?.textContent?.split(',')).toEqual(['0', 'false']);
  });
});

describe('Custom matchers', () => {
  test('should match values with a custom matcher', () => {
    const allItems = [
      { id: '1', status: 'active' },
      { id: '2', status: 'activating' },
      { id: '3', status: 'deactivating' },
      { id: '4', status: 'inactive' },
    ];
    const statusFilter: PropertyFilterProperty<string[]> = {
      key: 'status',
      operators: [
        { operator: '=', match: (value, tokenValue) => typeof value === 'string' && tokenValue.includes(value) },
        { operator: '!=', match: (value, tokenValue) => typeof value === 'string' && !tokenValue.includes(value) },
      ],
      propertyLabel: '',
      groupValuesLabel: '',
    };
    const propertyFiltering = {
      filteringProperties: [statusFilter],
      defaultQuery: {
        operation: 'and',
        tokens: [
          { propertyKey: 'status', operator: '=', value: ['active', 'activating', 'deactivating'] },
          { propertyKey: 'status', operator: '!=', value: ['deactivating'] },
        ],
      },
    } as const;
    function App() {
      const result = useCollection<Item>(allItems, { propertyFiltering });
      return <Demo {...result} />;
    }
    const { getVisibleItems } = render(<App />);
    expect(getVisibleItems()).toHaveLength(2);
  });
});

describe('total items count and page range', () => {
  test('should return the first index of the page', () => {
    const allItems = generateItems(4);
    function App() {
      const result = useCollection<Item>(allItems, { pagination: { pageSize: 2, defaultPage: 2 } });
      return <Demo {...result} />;
    }
    const { getRowIndices } = render(<App />);
    expect(getRowIndices()).toEqual(['3', '4']);
  });

  test('should return the first index of the page for the first page', () => {
    const allItems = generateItems(4);
    function App() {
      const result = useCollection<Item>(allItems, { pagination: { pageSize: 2, defaultPage: 1 } });
      return <Demo {...result} />;
    }
    const { getRowIndices } = render(<App />);
    expect(getRowIndices()).toEqual(['1', '2']);
  });

  test('should return the correct totalItems of the collection', () => {
    const allItems = generateItems(4);
    function App() {
      const result = useCollection<Item>(allItems, { pagination: { pageSize: 2, defaultPage: 2 } });
      return <Demo {...result} />;
    }
    const { getTotalItemsCount } = render(<App />);
    expect(getTotalItemsCount()).toEqual('4');
  });
});

describe('expandable items', () => {
  test('creates default expanded items state with expandableItems.defaultExpandedItems', () => {
    const allItems = generateItems(50);
    function App() {
      const result = useCollection(allItems, {
        pagination: {},
        expandableItems: {
          getParent: () => null,
          isExpandable: () => true,
          defaultExpandedItems: [allItems[0], allItems[2]],
        },
      });
      return <Demo {...result} />;
    }
    const { getExpandedItems } = render(<App />);
    const expandedItems = getExpandedItems();

    expect(expandedItems).toHaveLength(2);
    expect(expandedItems[0]).toBe('1');
    expect(expandedItems[1]).toBe('3');
  });

  test('expandable items state is changed with actions.setExpandedItems', () => {
    const allItems = generateItems(50);
    function App() {
      const result = useCollection(allItems, {
        pagination: { pageSize: 25 },
        expandableItems: { getParent: () => null, isExpandable: () => true },
      });
      return (
        <div>
          <Demo {...result} />
          <button data-testid="expand-all" onClick={() => result.actions.setExpandedItems(allItems)}></button>
        </div>
      );
    }
    const { queries, getExpandedItems } = render(<App />);

    fireEvent.click(queries.getByTestId('expand-all'));

    expect(getExpandedItems()).toHaveLength(25);
  });

  test('expandable items state is changed with collectionProps.onExpandChange', () => {
    const allItems = generateItems(50);
    function App() {
      const result = useCollection(allItems, {
        pagination: { pageSize: 25 },
        expandableItems: { getParent: () => null, isExpandable: () => true },
      });
      return (
        <div>
          <Demo {...result} />
          <button
            data-testid="expand-one"
            onClick={() =>
              result.collectionProps.onItemExpandedChange?.({ detail: { item: allItems[1], expanded: true } })
            }
          ></button>
        </div>
      );
    }
    const { queries, getExpandedItems } = render(<App />);

    fireEvent.click(queries.getByTestId('expand-one'));

    expect(getExpandedItems()).toEqual(['2']);
  });

  test('expanded items use trackBy for custom matching', () => {
    const allItems = generateItems(50);
    function App() {
      const result = useCollection(allItems, {
        pagination: {},
        expandableItems: {
          getParent: () => null,
          isExpandable: () => true,
          defaultExpandedItems: [{ id: allItems[0].id }, { id: allItems[2].id }],
          trackBy: item => item.id,
        },
      });
      return (
        <div>
          <Demo {...result} />
          <button
            data-testid="expand-all"
            onClick={() => result.actions.setExpandedItems([{ id: allItems[4].id }])}
          ></button>
        </div>
      );
    }
    const { queries, getExpandedItems } = render(<App />);
    const expandedItems1 = getExpandedItems();

    expect(expandedItems1).toHaveLength(2);
    expect(expandedItems1[0]).toBe('1');
    expect(expandedItems1[1]).toBe('3');

    fireEvent.click(queries.getByTestId('expand-all'));

    const expandedItems2 = getExpandedItems();
    expect(expandedItems2).toHaveLength(1);
    expect(expandedItems2[0]).toBe('5');
  });

  test('expanded items is used to hide items with non-expanded parents', () => {
    const allItems = generateItems(25);
    function App() {
      const result = useCollection(allItems, {
        pagination: { pageSize: 10 },
        expandableItems: {
          getParent: item => {
            if (allItems.indexOf(item) > 0 && allItems.indexOf(item) < 4) {
              return allItems[0];
            }
            if (allItems.indexOf(item) > 4 && allItems.indexOf(item) < 9) {
              return allItems[4];
            }
            if (allItems.indexOf(item) > 9 && allItems.indexOf(item) < 14) {
              return allItems[9];
            }
            if (allItems.indexOf(item) > 14 && allItems.indexOf(item) < 19) {
              return allItems[14];
            }
            if (allItems.indexOf(item) > 19 && allItems.indexOf(item) < 24) {
              return allItems[19];
            }
            return null;
          },
          isExpandable: () => true,
          defaultExpandedItems: [allItems[14]],
        },
      });
      return <Demo {...result} />;
    }
    const { getVisibleItems } = render(<App />);

    expect(getVisibleItems()).toEqual(['1', '5', '10', '15', '16', '17', '18', '19', '20', '25']);
  });

  test('expanded items is used to hide items with non-expanded grandparents', () => {
    const allItems = [
      { id: 'a' },
      { id: 'a.1' },
      { id: 'a.1.1' },
      { id: 'a.1.2' },
      { id: 'b' },
      { id: 'b.1' },
      { id: 'b.1.1' },
      { id: 'b.1.2' },
      { id: 'c' },
      { id: 'c.1' },
      { id: 'c.1.1' },
      { id: 'c.1.2' },
    ];
    function App() {
      const result = useCollection(allItems, {
        pagination: { pageSize: 10 },
        expandableItems: {
          getParent: item => allItems.find(maybeParent => item.id.slice(0, -2) === maybeParent.id) ?? null,
          isExpandable: () => true,
          defaultExpandedItems: [
            allItems.find(item => item.id === 'a')!,
            allItems.find(item => item.id === 'a.1')!,
            allItems.find(item => item.id === 'b')!,
          ],
        },
      });
      return <Demo {...result} />;
    }

    const { getVisibleItems: getVisibleItems } = render(<App />);
    expect(getVisibleItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b', 'b.1', 'c']);
  });

  test('expanded items state is updated to remove no-longer present items', () => {
    const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }];
    function App({ items, trackBy }: { items: Item[]; trackBy?: TrackBy<Item> }) {
      const result = useCollection(items, {
        pagination: { pageSize: 10 },
        expandableItems: {
          getParent: () => null,
          isExpandable: () => true,
          defaultExpandedItems: allItems,
          trackBy,
        },
      });
      return <Demo {...result} />;
    }

    const { rerender, getExpandedItems } = render(<App items={allItems} />);
    expect(getExpandedItems()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);

    rerender(<App items={[allItems[0], allItems[2], allItems[3], allItems[4], allItems[5]]} />);
    expect(getExpandedItems()).toEqual(['a', 'c', 'd', 'e', 'f']);

    rerender(<App items={allItems} />);
    expect(getExpandedItems()).toEqual(['a', 'c', 'd', 'e', 'f']);

    rerender(<App items={[{ id: 'a' }, { id: 'd' }, { id: 'f' }]} trackBy={item => item.id} />);
    expect(getExpandedItems()).toEqual(['a', 'd', 'f']);

    rerender(<App items={allItems} trackBy={item => item.id} />);
    expect(getExpandedItems()).toEqual(['a', 'd', 'f']);
  });

  test('propagates isExpandable to collection result', () => {
    const allItems = generateItems(50);
    const isExpandable = (item: Item) => item.id === '1' || item.id.includes('0');
    function App({ isExpandable }: { isExpandable: (item: Item) => boolean }) {
      const result = useCollection(allItems, {
        pagination: { pageSize: 50 },
        expandableItems: {
          getParent: () => null,
          isExpandable,
        },
      });
      return <Demo {...result} />;
    }

    const { rerender, getExpandableItems } = render(<App isExpandable={() => true} />);
    expect(getExpandableItems()).toEqual(allItems.map(item => item.id));

    rerender(<App isExpandable={isExpandable} />);
    expect(getExpandableItems()).toEqual(['1', '10', '20', '30', '40', '50']);
  });
});
