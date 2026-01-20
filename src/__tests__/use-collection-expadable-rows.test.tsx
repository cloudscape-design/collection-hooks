// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { test, expect, describe } from 'vitest';
import { UseCollectionOptions } from '..';
import { Item } from './stubs';
import { generateNestedItems, renderUseCollection } from './utils';

const getId = (item: Item) => item.id;
const getParentId = (item: Item): null | string => {
  const parts = item.id.split('.');
  return parts.length === 1 ? null : parts.slice(0, -1).join('.');
};

const items = [
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

function createEvent<D>(detail: D) {
  return new CustomEvent('cloudscape', { detail });
}

test('initializes expanded rows with expandableRows.defaultExpandedItems', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }];
  const { result } = renderUseCollection(items, {
    expandableRows: { getId, getParentId: () => null, defaultExpandedItems: [items[0], items[2]] },
  });
  expect(result.collectionProps.expandableRows!.expandedItems).toHaveLength(2);
  expect(result.collectionProps.expandableRows!.expandedItems[0].id).toBe('a');
  expect(result.collectionProps.expandableRows!.expandedItems[1].id).toBe('c');
});

test('expandableRows getters can be called on any item', () => {
  const { result } = renderUseCollection(items, {
    expandableRows: { getId, getParentId, defaultExpandedItems: [items[0]] },
  });
  const expandableRows = result.collectionProps.expandableRows!;

  expect(expandableRows.isItemExpandable({ id: 'x' })).toEqual(false);
  expect(expandableRows.getItemChildren({ id: 'x' })).toEqual([]);

  expect(expandableRows.isItemExpandable(items[0])).toEqual(true);
  expect(expandableRows.getItemChildren(items[0])).toEqual([{ id: 'a.1' }]);

  expect(expandableRows.isItemExpandable(items[1])).toEqual(true);
  expect(expandableRows.getItemChildren(items[1])).toEqual([{ id: 'a.1.1' }, { id: 'a.1.2' }]);

  expect(expandableRows.isItemExpandable(items[2])).toEqual(false);
  expect(expandableRows.getItemChildren(items[2])).toEqual([]);
});

test('displays root items and expanded items children only', () => {
  const { visibleItems } = renderUseCollection(items, {
    expandableRows: { getId, getParentId, defaultExpandedItems: [items[4]] },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'b', 'b.1', 'c']);
});

test('displays root items and expanded items children only in a deep tree', () => {
  const { visibleItems } = renderUseCollection(items, {
    expandableRows: { getId, getParentId, defaultExpandedItems: [items[0], items[1], items[4]] },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b', 'b.1', 'c']);
});

test('updates expanded items when collectionProps.onExpandableItemToggle is called', () => {
  const current = renderUseCollection(items, {
    expandableRows: { getId, getParentId, defaultExpandedItems: [items[4]] },
  });
  const toggle = current.result.collectionProps.expandableRows!.onExpandableItemToggle!;

  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual([{ id: 'b' }]);

  toggle(createEvent({ item: current.visibleItems[0], expanded: true }));
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual([{ id: 'b' }, { id: 'a' }]);

  toggle(createEvent({ item: current.visibleItems[0], expanded: false }));
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual([{ id: 'b' }]);

  // Ensuring expanded items has no duplicates.
  toggle(createEvent({ item: items[4], expanded: true }));
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual([{ id: 'b' }]);
});

test('updates expanded items with actions', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const current = renderUseCollection(items, { expandableRows: { getId, getParentId: () => null } });

  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual([]);

  current.result.actions.setExpandedItems(items);
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual(items);

  current.result.actions.setExpandedItems([]);
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual([]);
});

test('expanded items state is updated to remove no-longer present items', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }];
  const altItems = [items[0], items[2], items[3], items[4], items[5]];
  const expandableRows = { getId, getParentId: () => null, defaultExpandedItems: items };
  const current = renderUseCollection(items, { expandableRows });

  expect(current.result.collectionProps.expandableRows!.expandedItems).toBe(items);

  current.rerender(altItems, { expandableRows });
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual(altItems);

  current.rerender(items, { expandableRows });
  expect(current.result.collectionProps.expandableRows!.expandedItems).toEqual(altItems);
});

test('expanded rows with text filtering', () => {
  const sortableItems: (Item & { value?: string })[] = items.map(item => ({ ...item }));
  sortableItems.find(item => item.id === 'a.1')!.value = 'match';
  const { visibleItems } = renderUseCollection(sortableItems, {
    expandableRows: { getId, getParentId, defaultExpandedItems: sortableItems },
    filtering: { defaultFilteringText: 'match' },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'a.1']);
});

test('expanded rows with property filtering', () => {
  const filterableItems: (Item & { value?: string })[] = items.map(item => ({ ...item }));
  filterableItems.find(item => item.id === 'a.1')!.value = 'match';
  const { visibleItems } = renderUseCollection(filterableItems, {
    expandableRows: { getId, getParentId, defaultExpandedItems: filterableItems },
    propertyFiltering: {
      filteringProperties: [{ key: 'value', operators: ['='], propertyLabel: '', groupValuesLabel: '' }],
      defaultQuery: { tokens: [{ propertyKey: 'value', operator: '=', value: 'match' }], operation: 'and' },
    },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'a.1']);
});

test('expanded rows with pagination', () => {
  const expandableRows = { getId, getParentId, defaultExpandedItems: items };

  const result = renderUseCollection(items, { pagination: { pageSize: 10 }, expandableRows });
  expect(result.visibleItems).toEqual(items);

  result.rerender(items, { pagination: { pageSize: 2 }, expandableRows });
  expect(result.visibleItems).toEqual(items.filter(i => i.id.startsWith('a') || i.id.startsWith('b')));
});

test('expanded rows with sorting', () => {
  const sortableItems: Item[] = items
    .map(item => ({ ...item, value: Math.random() }))
    .sort((a, b) => a.value - b.value);
  const { visibleItems } = renderUseCollection(sortableItems, {
    sorting: { defaultState: { sortingColumn: { sortingField: 'id' } } },
    expandableRows: { getId, getParentId, defaultExpandedItems: sortableItems },
  });
  expect(visibleItems.map(i => i.id)).toEqual(items.map(i => i.id));
});

test.each([false, true])('expanded rows with selection and keepSelection=%s', keepSelection => {
  const defaultExpanded = [items[0], items[1], items[4], items[5]];
  const selected1 = [items[0], items[1], items[2], items[3], items[5]];
  const selected2 = [items[0], items[1], items[2], items[3], items[5], items[7]];
  const selected3 = [items[0], items[2], items[3], items[5], items[7]];
  const current = renderUseCollection(items, {
    expandableRows: { getId, getParentId, defaultExpandedItems: defaultExpanded },
    selection: { keepSelection, defaultSelectedItems: selected1 },
  });
  const getSelectedItems = () => current.result.collectionProps.selectedItems!;
  const setSelectedItems = (selectedItems: { id: string }[]) =>
    current.result.collectionProps.onSelectionChange!(new CustomEvent('cloudscape', { detail: { selectedItems } }));
  const toggleExpandedItem = (item: { id: string }, expanded: boolean) =>
    current.result.collectionProps.expandableRows!.onExpandableItemToggle(
      new CustomEvent('cloudscape', { detail: { item, expanded } })
    );

  expect(current.result.collectionProps.selectedItems).toEqual(selected1);

  setSelectedItems(selected2);
  expect(current.result.collectionProps.selectedItems).toEqual(selected2);

  setSelectedItems(selected3);
  expect(current.result.collectionProps.selectedItems).toEqual(selected3);

  toggleExpandedItem(items[1], false);
  expect(getSelectedItems()).toEqual(keepSelection ? selected3 : selected3.filter(i => !i.id.includes('a.1')));

  toggleExpandedItem(items[1], true);
  expect(getSelectedItems()).toEqual(keepSelection ? selected3 : selected3.filter(i => !i.id.includes('a.1')));
});

describe('trackBy', () => {
  function getTrackBy<T>(allItems: readonly T[], options: UseCollectionOptions<T>) {
    const { result } = renderUseCollection(allItems, options);
    if (typeof result.collectionProps.trackBy !== 'function') {
      throw new Error('trackBy is missing or not a function');
    }
    return result.collectionProps.trackBy!;
  }

  test('trackBy is added by expandableRows', () => {
    const trackBy = getTrackBy(items, { expandableRows: { getId, getParentId } });
    expect(trackBy(items[4])).toEqual('b');
  });

  test('selection.trackBy overrides expandableRows.getId', () => {
    const trackBy = getTrackBy(items, {
      expandableRows: { getId, getParentId },
      selection: { trackBy: item => item.id + item.id },
    });
    expect(trackBy(items[4])).toEqual('bb');
  });

  test('selection without trackBy does not override expandableRows.trackBy', () => {
    const trackBy = getTrackBy(items, { expandableRows: { getId, getParentId }, selection: {} });
    expect(trackBy(items[1])).toEqual('a.1');
  });
});

describe('data grouping', () => {
  test('computes total counts correctly', () => {
    const expandable = renderUseCollection(items, { expandableRows: { getId, getParentId } });
    expect(expandable.result.collectionProps.totalItemsCount).toBe(items.length);

    const grouped = renderUseCollection(items, { expandableRows: { getId, getParentId, dataGrouping: true } });
    expect(grouped.result.collectionProps.totalItemsCount).toBe(6);
  });

  test('computes total selected counts correctly', () => {
    const expandable = renderUseCollection(items, {
      expandableRows: { getId, getParentId },
      selection: { defaultSelectedItems: [{ id: 'a' }, { id: 'a.1.1' }], keepSelection: true },
    });
    expect(expandable.result.collectionProps.totalSelectedItemsCount).toBe(2);

    const grouped = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a' }, { id: 'a.1.1' }], keepSelection: true },
    });
    expect(grouped.result.collectionProps.totalSelectedItemsCount).toBe(1);
  });

  test('does not return per-item counts when dataGrouping=undefined', () => {
    const { result } = renderUseCollection(items, { expandableRows: { getId, getParentId }, selection: {} });
    expect(result.collectionProps.expandableRows!.getItemsCount).toBe(undefined);
    expect(result.collectionProps.expandableRows!.getSelectedItemsCount).toBe(undefined);
  });

  test('can call selection counts on missing items', () => {
    const { result } = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: {},
    });
    expect(result.collectionProps.expandableRows!.getItemsCount!({ id: 'x' })).toBe(0);
    expect(result.collectionProps.expandableRows!.getSelectedItemsCount!({ id: 'x' })).toBe(0);
  });

  test('does not return per-item selection counts when selection=undefined', () => {
    const { result } = renderUseCollection(items, { expandableRows: { getId, getParentId, dataGrouping: true } });
    expect(result.collectionProps.expandableRows!.getSelectedItemsCount).toBe(undefined);
  });

  test('computes item counts correctly', () => {
    const { result } = renderUseCollection(items, { expandableRows: { getId, getParentId, dataGrouping: true } });
    const expandableRows = result.collectionProps.expandableRows!;

    expect(expandableRows.getItemsCount!({ id: 'a' })).toBe(2);
    expect(expandableRows.getItemsCount!({ id: 'a.1' })).toBe(2);
    expect(expandableRows.getItemsCount!({ id: 'a.1.1' })).toBe(1);
    expect(expandableRows.getItemsCount!({ id: 'a.1.2' })).toBe(1);
  });

  test('item counts sum up to total count', () => {
    for (let totalItems = 1; totalItems <= 25; totalItems += 5) {
      const items = generateNestedItems({ totalItems });
      const { result } = renderUseCollection(items, {
        expandableRows: { getId, getParentId, dataGrouping: true },
      });
      const expandableRows = result.collectionProps.expandableRows!;
      const sumCounts = result.items.reduce((sum, i) => sum + expandableRows.getItemsCount!(i), 0);
      expect(sumCounts).toBe(result.collectionProps.totalItemsCount);
    }
  });

  test('total count equals items size when dataGrouping=undefined', () => {
    for (let totalItems = 1; totalItems <= 25; totalItems += 5) {
      const items = generateNestedItems({ totalItems });
      const { result } = renderUseCollection(items, { expandableRows: { getId, getParentId } });
      expect(result.collectionProps.totalItemsCount).toBe(items.length);
    }
  });

  test('computes selected item counts correctly', () => {
    const { result } = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a.1.1' }, { id: 'b.1.1' }, { id: 'b.1.2' }] },
    });
    const expandableRows = result.collectionProps.expandableRows!;
    expect(items.map(expandableRows.getSelectedItemsCount!)).toEqual([1, 1, 1, 0, 2, 2, 1, 1, 0, 0, 0, 0]);
  });

  test('computes projected selectedItems state', () => {
    const leaf = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a.1.1' }, { id: 'b.1.1' }, { id: 'b.1.2' }] },
    });
    expect(leaf.result.collectionProps.selectedItems).toEqual([{ id: 'a.1.1' }, { id: 'b.1.1' }, { id: 'b.1.2' }]);

    const deep = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a' }, { id: 'b' }, { id: 'b.1' }, { id: 'c' }, { id: 'c.1.2' }] },
    });
    expect(deep.result.collectionProps.selectedItems).toEqual([{ id: 'a.1.1' }, { id: 'a.1.2' }, { id: 'c.1.1' }]);

    const missing = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'x' }] },
    });
    expect(missing.result.collectionProps.selectedItems).toEqual([]);
  });

  test('ignores selected items state in favour of projected selected items', () => {
    const { result } = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a.1.1' }, { id: 'b.1.1' }, { id: 'b.1.2' }] },
    });

    result.actions.setSelectedItems([{ id: 'c.1.1' }]);

    expect(result.collectionProps.selectedItems).toEqual([{ id: 'a.1.1' }, { id: 'b.1.1' }, { id: 'b.1.2' }]);
  });

  test('group selection is undefined when dataGrouping=undefined', () => {
    const { result } = renderUseCollection(items, { expandableRows: { getId, getParentId }, selection: {} });
    expect(result.collectionProps.expandableRows!.groupSelection).toBe(undefined);
  });

  test('group selection is undefined when selection=undefined', () => {
    const { result } = renderUseCollection(items, { expandableRows: { getId, getParentId, dataGrouping: true } });
    expect(result.collectionProps.expandableRows!.groupSelection).toBe(undefined);
  });

  test('converts default selected items to group selection and back', () => {
    const current = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a' }, { id: 'a.1.1' }] },
    });
    expect(current.result.collectionProps.expandableRows!.groupSelection).toEqual({
      inverted: false,
      toggledItems: [{ id: 'a' }, { id: 'a.1.1' }],
    });

    current.result.actions.setGroupSelection({
      inverted: true,
      toggledItems: [{ id: 'a' }, { id: 'a.1.1' }, { id: 'c' }],
    });
    expect(current.result.collectionProps.selectedItems).toEqual([{ id: 'a.1.1' }, { id: 'b.1.1' }, { id: 'b.1.2' }]);
  });

  test('changes group selection with event handler', () => {
    const current = renderUseCollection(items, {
      expandableRows: { getId, getParentId, dataGrouping: true },
      selection: { defaultSelectedItems: [{ id: 'a' }, { id: 'a.1.1' }] },
    });
    const changeSelection = current.result.collectionProps.expandableRows!.onGroupSelectionChange;

    changeSelection({ detail: { inverted: false, toggledItems: [{ id: 'a' }] } });
    expect(current.result.collectionProps.expandableRows!.groupSelection).toEqual({
      inverted: false,
      toggledItems: [{ id: 'a' }],
    });
  });
});
