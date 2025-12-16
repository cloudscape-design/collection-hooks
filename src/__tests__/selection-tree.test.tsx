// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { test, expect } from 'vitest';
import { SelectionTree } from '../operations/selection-tree';
import { computeTreeItems } from '../operations/items-tree';
import { GroupSelectionState, TrackBy } from '../interfaces';

type Item = string;

const getId = (item: Item) => item;
const getParentId = (item: Item): null | string => {
  const parts = item.split('.');
  return parts.length === 1 ? null : parts.slice(0, -1).join('.');
};

const createSelectionTree = (allItems: Item[], state: GroupSelectionState<Item>, trackBy?: TrackBy<Item>) => {
  const { items, getChildren } = computeTreeItems(allItems, { getId, getParentId, dataGrouping: true }, null, null);
  return new SelectionTree(items, { getChildren, trackBy }, state);
};

test.each<GroupSelectionState<Item>>([
  { baseline: 'all', toggledItems: [] },
  { baseline: 'none', toggledItems: [] },
  { baseline: 'all', toggledItems: ['x'] },
  { baseline: 'none', toggledItems: ['x'] },
])('creates empty selection when items are empty, state=%s', state => {
  const tree = createSelectionTree([], state);
  expect(tree.getState()).toEqual({ baseline: state.baseline, toggledItems: [] });
});

test.each<GroupSelectionState<Item>>([
  { baseline: 'none', toggledItems: ['a', 'a.1'] },
  { baseline: 'none', toggledItems: ['b', 'b.1.1'] },
  { baseline: 'none', toggledItems: ['c', 'c.1', 'c.2'] },
  { baseline: 'all', toggledItems: ['a', 'b', 'c'] },
  { baseline: 'all', toggledItems: ['a', 'b', 'b.1', 'b.1.1', 'c'] },
])('creates empty selection when given selection is exclusive, state=%s', state => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'c', 'c.1', 'c.2'], state);
  expect(tree.getState()).toEqual({ baseline: 'none', toggledItems: [] });
});

test.each<GroupSelectionState<Item>>([
  { baseline: 'none', toggledItems: ['a', 'b.1.1', 'c', 'c.2'] },
  { baseline: 'all', toggledItems: ['b', 'b.1.1', 'c.2'] },
])('item selection getters produce expected result, state=%s', state => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], state);
  const getItemState = (item: Item) => ({
    s: tree.isItemSelected(item),
    i: tree.isItemIndeterminate(item),
    c: tree.getSelectedItemsCount(item),
  });
  expect(getItemState('a')).toEqual({ s: true, i: false, c: 1 });
  expect(getItemState('a.1')).toEqual({ s: true, i: false, c: 1 });
  expect(getItemState('b')).toEqual({ s: false, i: true, c: 1 });
  expect(getItemState('b.1')).toEqual({ s: false, i: true, c: 1 });
  expect(getItemState('b.1.1')).toEqual({ s: true, i: false, c: 1 });
  expect(getItemState('b.1.2')).toEqual({ s: false, i: false, c: 0 });
  expect(getItemState('c')).toEqual({ s: true, i: true, c: 1 });
  expect(getItemState('c.1')).toEqual({ s: true, i: false, c: 1 });
  expect(getItemState('c.2')).toEqual({ s: false, i: false, c: 0 });
});

test('can call item selection getters on missing items', () => {
  const tree = createSelectionTree(['a', 'a.1', 'b'], { baseline: 'none', toggledItems: ['a.1'] });
  expect(tree.isItemSelected('x')).toBe(false);
  expect(tree.isItemIndeterminate('x')).toBe(false);
  expect(tree.getSelectedItemsCount('x')).toBe(0);
});

test.each<[Item[], GroupSelectionState<Item>, [boolean, boolean]]>([
  [[], { baseline: 'none', toggledItems: [] }, [false, false]],
  [[], { baseline: 'all', toggledItems: [] }, [false, false]],
  [['a'], { baseline: 'none', toggledItems: [] }, [false, false]],
  [['a'], { baseline: 'all', toggledItems: [] }, [true, false]],
  [['a'], { baseline: 'none', toggledItems: ['a'] }, [true, false]],
  [['a'], { baseline: 'all', toggledItems: ['a'] }, [false, false]],
  [['a', 'b'], { baseline: 'none', toggledItems: ['a'] }, [false, true]],
  [['a', 'b'], { baseline: 'all', toggledItems: ['a'] }, [false, true]],
])('computes all items selected, params: [%s, %s, %s]', (items, state, [allSelected, allIndeterminate]) => {
  const tree = createSelectionTree(items, state);
  expect(tree.isAllItemsSelected()).toBe(allSelected);
  expect(tree.isAllItemsIndeterminate()).toBe(allIndeterminate);
});

test.each<GroupSelectionState<Item>>([
  { baseline: 'none', toggledItems: ['a', 'b.1.1', 'c', 'c.2'] },
  { baseline: 'all', toggledItems: ['b', 'b.1.1', 'c.2'] },
])('computes selected leaf items, state=%s', state => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], state);
  expect(tree.getSelectedLeafItems()).toEqual(['a.1', 'b.1.1', 'c.1']);
});

test.each<[GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  [
    { baseline: 'none', toggledItems: [] },
    { baseline: 'all', toggledItems: [] },
  ],
  [
    { baseline: 'none', toggledItems: ['b.1.1'] },
    { baseline: 'all', toggledItems: [] },
  ],
  [
    { baseline: 'all', toggledItems: ['b.1.1'] },
    { baseline: 'all', toggledItems: [] },
  ],
  [
    { baseline: 'all', toggledItems: [] },
    { baseline: 'none', toggledItems: [] },
  ],
])('toggles all, from: %s, to: %s', (from, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], from);
  expect(tree.toggleAll().getState()).toEqual(to);
});

test.each<[GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  [
    { baseline: 'none', toggledItems: [] },
    { baseline: 'none', toggledItems: [] },
  ],
  [
    { baseline: 'all', toggledItems: [] },
    { baseline: 'all', toggledItems: [] },
  ],
  [
    { baseline: 'none', toggledItems: ['a.1'] },
    { baseline: 'all', toggledItems: ['b', 'c'] },
  ],
  [
    { baseline: 'all', toggledItems: ['b', 'c'] },
    { baseline: 'none', toggledItems: ['a'] },
  ],
])('inverts all, from: %s, to: %s', (from, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], from);
  expect(tree.invertAll().getState()).toEqual(to);
});

test.each<[GroupSelectionState<Item>, Item, GroupSelectionState<Item>]>([
  [{ baseline: 'none', toggledItems: [] }, 'a.1', { baseline: 'none', toggledItems: ['a'] }],
  [{ baseline: 'all', toggledItems: [] }, 'a.1', { baseline: 'all', toggledItems: ['a'] }],
  [{ baseline: 'none', toggledItems: ['b', 'c'] }, 'a.1', { baseline: 'all', toggledItems: [] }],
  [{ baseline: 'all', toggledItems: ['b', 'c'] }, 'a.1', { baseline: 'none', toggledItems: [] }],
])('toggles item, from: %s, item: %s, to: %s', (from, item, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], from);
  expect(tree.toggleSome([item]).getState()).toEqual(to);
});

test.each<[GroupSelectionState<Item>, Item, GroupSelectionState<Item>]>([
  [{ baseline: 'none', toggledItems: [] }, 'a.1', { baseline: 'none', toggledItems: [] }],
  [{ baseline: 'all', toggledItems: [] }, 'a.1', { baseline: 'all', toggledItems: [] }],
  [{ baseline: 'none', toggledItems: [] }, 'a.1.1', { baseline: 'none', toggledItems: ['a.1.1'] }],
  [{ baseline: 'all', toggledItems: [] }, 'a.1.1', { baseline: 'all', toggledItems: ['a.1.1'] }],
  [{ baseline: 'none', toggledItems: ['a.1.1'] }, 'a.1', { baseline: 'none', toggledItems: ['a.1', 'a.1.2'] }],
  [{ baseline: 'all', toggledItems: ['a.1.1'] }, 'a.1', { baseline: 'all', toggledItems: ['a.1', 'a.1.2'] }],
])('inverts item, from: %s, item: %s, to: %s', (from, item, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'a.1.1', 'a.1.2', 'a.2'], from);
  expect(tree.invertOne(item).getState()).toEqual(to);
});

test('can trigger selection actions on missing items', () => {
  const tree = createSelectionTree(['a', 'a.1', 'b'], { baseline: 'none', toggledItems: ['a.1'] });
  expect(tree.toggleSome(['x']).invertOne('x').getState()).toEqual({ baseline: 'none', toggledItems: ['a'] });
});

test('tracks items by reference', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getId = (item: { id: string }) => item.id;
  const getParentId = () => null;
  const { items, getChildren } = computeTreeItems(allItems, { getId, getParentId, dataGrouping: true }, null, null);
  const tree = new SelectionTree(items, { getChildren }, { baseline: 'all', toggledItems: [items[0], { id: 'b' }] });
  expect(tree.getState()).toEqual({ baseline: 'all', toggledItems: [{ id: 'a' }] });
});

test('tracks items with trackBy', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getId = (item: { id: string }) => item.id;
  const getParentId = () => null;
  const { items, getChildren } = computeTreeItems(allItems, { getId, getParentId, dataGrouping: true }, null, null);
  const tree = new SelectionTree(
    items,
    { getChildren, trackBy: getId },
    { baseline: 'all', toggledItems: [items[0], { id: 'b' }] }
  );
  expect(tree.getState()).toEqual({ baseline: 'all', toggledItems: [{ id: 'a' }, { id: 'b' }] });
});
