// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { test, expect, describe } from 'vitest';
import { UseCollectionOptions } from '..';
import { Item } from './stubs';
import { renderUseCollection } from './utils';

const getId = (item: Item) => item.id;
const getParentId = () => null;
const generateItems = (length: number) =>
  Array.from({ length }, (_, index) => ({ id: `${index + 1}` })) as ReadonlyArray<Item>;

const treeItems = generateItems(25);
const getTreeParentId = (item: Item) => {
  if (treeItems.indexOf(item) > 0 && treeItems.indexOf(item) < 4) {
    return treeItems[0].id;
  }
  if (treeItems.indexOf(item) > 4 && treeItems.indexOf(item) < 9) {
    return treeItems[4].id;
  }
  if (treeItems.indexOf(item) > 9 && treeItems.indexOf(item) < 14) {
    return treeItems[9].id;
  }
  if (treeItems.indexOf(item) > 14 && treeItems.indexOf(item) < 19) {
    return treeItems[14].id;
  }
  if (treeItems.indexOf(item) > 19 && treeItems.indexOf(item) < 24) {
    return treeItems[19].id;
  }
  return null;
};

const deepTreeItems = [
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
const getDeepTreeParentId = (item: Item) =>
  deepTreeItems.find(maybeParent => item.id.slice(0, -2) === maybeParent.id)?.id ?? null;

function createEvent<D>(detail: D) {
  return new CustomEvent('cloudscape', { detail });
}

test('initializes expanded rows with expandableRows.defaultExpandedItems', () => {
  const items = generateItems(50);
  const { collection } = renderUseCollection(items, {
    expandableRows: { getId, getParentId, defaultExpandedItems: [items[0], items[2]] },
  });
  expect(collection.collectionProps.expandableRows!.expandedItems).toHaveLength(2);
  expect(collection.collectionProps.expandableRows!.expandedItems[0].id).toBe('1');
  expect(collection.collectionProps.expandableRows!.expandedItems[1].id).toBe('3');
});

test('expandableRows getters can be called on any item', () => {
  const items = deepTreeItems;
  const { collection } = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getDeepTreeParentId, defaultExpandedItems: [items[0]] },
  });
  const expandableRows = collection.collectionProps.expandableRows!;

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
  const items = treeItems;
  const { visibleItems } = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getTreeParentId, defaultExpandedItems: [items[14]] },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['1', '5', '10', '15', '16', '17', '18', '19', '20', '25']);
});

test('displays root items and expanded items children only in a deep tree', () => {
  const items = deepTreeItems;
  const { visibleItems } = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getDeepTreeParentId, defaultExpandedItems: [items[0], items[1], items[4]] },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b', 'b.1', 'c']);
});

test('updates expanded items when collectionProps.onExpandableItemToggle is called', () => {
  const items = treeItems;
  const result = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getTreeParentId, defaultExpandedItems: [items[9]] },
  });
  const toggle = result.collection.collectionProps.expandableRows!.onExpandableItemToggle!;

  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual([{ id: '10' }]);

  toggle(createEvent({ item: result.visibleItems[1], expanded: true }));
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual([{ id: '10' }, { id: '5' }]);

  toggle(createEvent({ item: result.visibleItems[1], expanded: false }));
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual([{ id: '10' }]);

  // Ensuring expanded items has no duplicates.
  toggle(createEvent({ item: items[9], expanded: true }));
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual([{ id: '10' }]);
});

test('updates expanded items with actions', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const result = renderUseCollection(items, { expandableRows: { getId, getParentId } });

  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual([]);

  result.collection.actions.setExpandedItems(items);
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual(items);

  result.collection.actions.setExpandedItems([]);
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual([]);
});

test('expanded items state is updated to remove no-longer present items', () => {
  const items = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }];
  const altItems = [items[0], items[2], items[3], items[4], items[5]];
  const expandableRows = { getId, getParentId, defaultExpandedItems: items };
  const result = renderUseCollection(items, { expandableRows });

  expect(result.collection.collectionProps.expandableRows!.expandedItems).toBe(items);

  result.rerender(altItems, { expandableRows });
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual(altItems);

  result.rerender(items, { expandableRows });
  expect(result.collection.collectionProps.expandableRows!.expandedItems).toEqual(altItems);
});

test('expanded rows with text filtering', () => {
  const items: (Item & { value?: string })[] = deepTreeItems.map(item => ({ ...item }));
  items.find(item => item.id === 'a.1')!.value = 'match';
  const { visibleItems } = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getDeepTreeParentId, defaultExpandedItems: items },
    filtering: { defaultFilteringText: 'match' },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'a.1']);
});

test('expanded rows with property filtering', () => {
  const items: (Item & { value?: string })[] = deepTreeItems.map(item => ({ ...item }));
  items.find(item => item.id === 'a.1')!.value = 'match';
  const { visibleItems } = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getDeepTreeParentId, defaultExpandedItems: items },
    propertyFiltering: {
      filteringProperties: [{ key: 'value', operators: ['='], propertyLabel: '', groupValuesLabel: '' }],
      defaultQuery: { tokens: [{ propertyKey: 'value', operator: '=', value: 'match' }], operation: 'and' },
    },
  });
  expect(visibleItems.map(i => i.id)).toEqual(['a', 'a.1']);
});

test('expanded rows with pagination', () => {
  const items = treeItems;
  const expandableRows = { getId, getParentId: getTreeParentId, defaultExpandedItems: items };

  const result = renderUseCollection(items, { pagination: { pageSize: 10 }, expandableRows });
  expect(result.visibleItems).toEqual(items);

  result.rerender(items, { pagination: { pageSize: 3 }, expandableRows });
  expect(result.visibleItems).toEqual(items.slice(0, 14));
});

test('expanded rows with sorting', () => {
  const items: Item[] = deepTreeItems
    .map(item => ({ ...item, value: Math.random() }))
    .sort((a, b) => a.value - b.value);
  const { visibleItems } = renderUseCollection(items, {
    sorting: { defaultState: { sortingColumn: { sortingField: 'id' } } },
    expandableRows: { getId, getParentId: getDeepTreeParentId, defaultExpandedItems: items },
  });
  expect(visibleItems.map(i => i.id)).toEqual(deepTreeItems.map(i => i.id));
});

test.each([false, true])('expanded rows with selection and keepSelection=%s', keepSelection => {
  const items = [...deepTreeItems];
  const defaultExpanded = [items[0], items[1], items[4], items[5]];
  const selected1 = [items[0], items[1], items[2], items[3], items[5]];
  const selected2 = [items[0], items[1], items[2], items[3], items[5], items[7]];
  const selected3 = [items[0], items[2], items[3], items[5], items[7]];
  const result = renderUseCollection(items, {
    expandableRows: { getId, getParentId: getDeepTreeParentId, defaultExpandedItems: defaultExpanded },
    selection: { keepSelection, defaultSelectedItems: selected1 },
  });
  const getSelectedItems = () => result.collection.collectionProps.selectedItems!;
  const setSelectedItems = (selectedItems: { id: string }[]) =>
    result.collection.collectionProps.onSelectionChange!(new CustomEvent('cloudscape', { detail: { selectedItems } }));
  const toggleExpandedItem = (item: { id: string }, expanded: boolean) =>
    result.collection.collectionProps.expandableRows!.onExpandableItemToggle(
      new CustomEvent('cloudscape', { detail: { item, expanded } })
    );

  expect(result.collection.collectionProps.selectedItems).toEqual(selected1);

  setSelectedItems(selected2);
  expect(result.collection.collectionProps.selectedItems).toEqual(selected2);

  setSelectedItems(selected3);
  expect(result.collection.collectionProps.selectedItems).toEqual(selected3);

  toggleExpandedItem(items[1], false);
  expect(getSelectedItems()).toEqual(keepSelection ? selected3 : selected3.filter(i => !i.id.includes('a.1')));

  toggleExpandedItem(items[1], true);
  expect(getSelectedItems()).toEqual(keepSelection ? selected3 : selected3.filter(i => !i.id.includes('a.1')));
});

describe('trackBy', () => {
  function getTrackBy<T>(allItems: readonly T[], options: UseCollectionOptions<T>) {
    const { collection } = renderUseCollection(allItems, options);
    if (typeof collection.collectionProps.trackBy !== 'function') {
      throw new Error('trackBy is missing or not a function');
    }
    return collection.collectionProps.trackBy!;
  }

  test('trackBy is added by expandableRows', () => {
    const trackBy = getTrackBy(treeItems, { expandableRows: { getId, getParentId } });
    expect(trackBy(treeItems[1])).toEqual('2');
  });

  test('selection.trackBy overrides expandableRows.getId', () => {
    const trackBy = getTrackBy(treeItems, {
      expandableRows: { getId, getParentId },
      selection: { trackBy: item => item.id + item.id },
    });
    expect(trackBy(treeItems[1])).toEqual('22');
  });

  test('selection without trackBy does not override expandableRows.trackBy', () => {
    const trackBy = getTrackBy(deepTreeItems, { expandableRows: { getId, getParentId }, selection: {} });
    expect(trackBy(treeItems[1])).toEqual('2');
  });
});
