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

const createSelectionTree = (
  allItems: Item[],
  state: GroupSelectionState<Item>,
  { trackBy, isComplete }: { trackBy?: TrackBy<Item>; isComplete?: (item: null | Item) => boolean } = {}
) => {
  const { items, getChildren } = computeTreeItems(allItems, { getId, getParentId, dataGrouping: true }, null, null);
  return new SelectionTree(items, { getChildren, trackBy, isComplete }, state);
};

test.each<GroupSelectionState<Item>>([
  { inverted: true, toggledItems: [] },
  { inverted: false, toggledItems: [] },
  { inverted: true, toggledItems: ['x'] },
  { inverted: false, toggledItems: ['x'] },
])('creates empty selection when items are empty, state=%s', state => {
  const tree = createSelectionTree([], state);
  expect(tree.getState()).toEqual({ inverted: state.inverted, toggledItems: [] });
});

test.each<GroupSelectionState<Item>>([
  { inverted: false, toggledItems: ['a', 'b.1.1', 'c', 'c.2'] },
  { inverted: true, toggledItems: ['b', 'b.1.1', 'c.2'] },
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
  const tree = createSelectionTree(['a', 'a.1', 'b'], { inverted: false, toggledItems: ['a.1'] });
  expect(tree.isItemSelected('x')).toBe(false);
  expect(tree.isItemIndeterminate('x')).toBe(false);
  expect(tree.getSelectedItemsCount('x')).toBe(0);
});

test.each<[Item[], GroupSelectionState<Item>, [boolean, boolean]]>([
  [[], { inverted: false, toggledItems: [] }, [false, false]],
  [[], { inverted: true, toggledItems: [] }, [false, false]],
  [['a'], { inverted: false, toggledItems: [] }, [false, false]],
  [['a'], { inverted: true, toggledItems: [] }, [true, false]],
  [['a'], { inverted: false, toggledItems: ['a'] }, [true, false]],
  [['a'], { inverted: true, toggledItems: ['a'] }, [false, false]],
  [['a', 'b'], { inverted: false, toggledItems: ['a'] }, [false, true]],
  [['a', 'b'], { inverted: true, toggledItems: ['a'] }, [false, true]],
])('computes all items selected, params: [%s, %s, %s]', (items, state, [allSelected, allIndeterminate]) => {
  const tree = createSelectionTree(items, state);
  expect(tree.isAllItemsSelected()).toBe(allSelected);
  expect(tree.isAllItemsIndeterminate()).toBe(allIndeterminate);
});

test.each<GroupSelectionState<Item>>([
  { inverted: false, toggledItems: ['a', 'b.1.1', 'c', 'c.2'] },
  { inverted: true, toggledItems: ['b', 'b.1.1', 'c.2'] },
])('computes selected leaf items, state=%s', state => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], state);
  expect(tree.getSelectedItems()).toEqual(['a.1', 'b.1.1', 'c.1']);
});

test.each<[GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  [
    { inverted: false, toggledItems: [] },
    { inverted: true, toggledItems: [] },
  ],
  [
    { inverted: false, toggledItems: ['b.1.1'] },
    { inverted: true, toggledItems: [] },
  ],
  [
    { inverted: true, toggledItems: ['b.1.1'] },
    { inverted: true, toggledItems: [] },
  ],
  [
    { inverted: true, toggledItems: [] },
    { inverted: false, toggledItems: [] },
  ],
])('toggles all, from: %s, to: %s', (from, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], from);
  expect(tree.toggleAll().getState()).toEqual(to);
});

test.each<[GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  [
    { inverted: false, toggledItems: [] },
    { inverted: false, toggledItems: [] },
  ],
  [
    { inverted: true, toggledItems: [] },
    { inverted: true, toggledItems: [] },
  ],
  [
    { inverted: false, toggledItems: ['a.1'] },
    { inverted: true, toggledItems: ['b', 'c'] },
  ],
  [
    { inverted: true, toggledItems: ['b', 'c'] },
    { inverted: false, toggledItems: ['a'] },
  ],
])('inverts all, from: %s, to: %s', (from, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], from);
  expect(tree.invertAll().getState()).toEqual(to);
});

test.each<[Item, GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  ['a', { inverted: false, toggledItems: [] }, { inverted: false, toggledItems: ['a'] }],
  ['a', { inverted: true, toggledItems: [] }, { inverted: true, toggledItems: ['a'] }],
  ['a', { inverted: false, toggledItems: ['a'] }, { inverted: false, toggledItems: [] }],
  ['a', { inverted: true, toggledItems: ['a'] }, { inverted: true, toggledItems: [] }],
  ['b.1.1', { inverted: false, toggledItems: [] }, { inverted: false, toggledItems: ['b.1.1'] }],
  ['b.1.1', { inverted: true, toggledItems: [] }, { inverted: true, toggledItems: ['b.1.1'] }],
  ['b.1.1', { inverted: false, toggledItems: ['b.1.1'] }, { inverted: false, toggledItems: [] }],
  ['b.1.1', { inverted: true, toggledItems: ['b.1.1'] }, { inverted: true, toggledItems: [] }],
])('toggles item %s, %s -> %s', (item, from, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'b', 'b.1', 'b.1.1', 'b.1.2', 'c', 'c.1', 'c.2'], from);
  expect(tree.toggleSome([item]).getState()).toEqual(to);
});

test.each<[Item, GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  ['a.1', { inverted: false, toggledItems: [] }, { inverted: false, toggledItems: [] }],
  ['a.1', { inverted: true, toggledItems: [] }, { inverted: true, toggledItems: [] }],
  ['a.1.1', { inverted: false, toggledItems: [] }, { inverted: false, toggledItems: ['a.1.1'] }],
  ['a.1.1', { inverted: true, toggledItems: [] }, { inverted: true, toggledItems: ['a.1.1'] }],
  ['a.1', { inverted: false, toggledItems: ['a.1.1'] }, { inverted: false, toggledItems: ['a.1', 'a.1.2'] }],
  ['a.1', { inverted: true, toggledItems: ['a.1.1'] }, { inverted: true, toggledItems: ['a.1', 'a.1.2'] }],
])('inverts item %s, %s -> %s', (item, from, to) => {
  const tree = createSelectionTree(['a', 'a.1', 'a.1.1', 'a.1.2', 'a.2'], from);
  expect(tree.invertOne(item).getState()).toEqual(to);
});

test('computes indeterminate state deeply', () => {
  const tree = createSelectionTree(['a', 'a.1', 'a.1.1', 'a.1.2'], { inverted: true, toggledItems: ['a.1.1'] });
  expect(tree.isItemSelected('a.1.1')).toBe(false);
  expect(tree.isItemSelected('a.1.2')).toBe(true);
  expect(tree.isItemIndeterminate('a.1')).toBe(true);
  expect(tree.isItemIndeterminate('a')).toBe(true);
  expect(tree.isAllItemsIndeterminate()).toBe(true);
});

test.each<[Item[], GroupSelectionState<Item>, GroupSelectionState<Item>]>([
  [['a', 'b', 'c'], { inverted: false, toggledItems: ['a', 'b', 'c'] }, { inverted: true, toggledItems: [] }],
  [['a', 'b', 'c'], { inverted: true, toggledItems: ['a', 'b', 'c'] }, { inverted: false, toggledItems: [] }],
  [['a', 'a.1', 'b'], { inverted: false, toggledItems: ['a.1'] }, { inverted: false, toggledItems: ['a'] }],
  [['a', 'a.1', 'b'], { inverted: true, toggledItems: ['a.1'] }, { inverted: true, toggledItems: ['a'] }],
  [['a', 'a.1', 'a.2'], { inverted: false, toggledItems: ['a.1', 'a.2'] }, { inverted: true, toggledItems: [] }],
  [['a', 'a.1', 'a.2'], { inverted: true, toggledItems: ['a.1', 'a.2'] }, { inverted: false, toggledItems: [] }],
])('normalizes state [%s] %s -> %s', (items, state, normalizedState) => {
  const tree = createSelectionTree(items, state);
  expect(tree.getState()).toEqual(normalizedState);
});

test.each<[Item[], GroupSelectionState<Item>]>([
  [['a', 'b'], { inverted: false, toggledItems: ['a', 'b'] }],
  [['a', 'b'], { inverted: true, toggledItems: ['a', 'b'] }],
])('skips normalization for incomplete root [%s] %s', (items, state) => {
  const tree = createSelectionTree(items, state, { isComplete: item => (!item ? false : true) });
  expect(tree.getState()).toEqual(state);
  expect(tree.isAllItemsSelected()).toBe(false);
  expect(tree.isAllItemsIndeterminate()).toBe(true);
});

test.each<[Item[], GroupSelectionState<Item>]>([
  [['a', 'a.1', 'b'], { inverted: false, toggledItems: ['a.1'] }],
  [['a', 'a.1', 'b'], { inverted: true, toggledItems: ['a.1'] }],
  [['a', 'a.1', 'a.2'], { inverted: false, toggledItems: ['a.1', 'a.2'] }],
  [['a', 'a.1', 'a.2'], { inverted: true, toggledItems: ['a.1', 'a.2'] }],
])('skips normalization for incomplete group [%s] %s', (items, state) => {
  const tree = createSelectionTree(items, state, { isComplete: item => (item === 'a' ? false : true) });
  expect(tree.getState()).toEqual(state);
  expect(tree.isItemSelected('a')).toBe(state.inverted);
  expect(tree.isItemIndeterminate('a')).toBe(true);
});

test('can trigger selection actions on missing items', () => {
  const tree = createSelectionTree(['a', 'a.1', 'b'], { inverted: false, toggledItems: ['a.1'] });
  expect(tree.toggleSome(['x']).getState()).toEqual({ inverted: false, toggledItems: ['a'] });
  expect(tree.invertOne('x').getState()).toEqual({ inverted: false, toggledItems: ['a'] });
});

test('tracks items by reference', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getId = (item: { id: string }) => item.id;
  const getParentId = () => null;
  const { items, getChildren } = computeTreeItems(allItems, { getId, getParentId, dataGrouping: true }, null, null);
  const tree = new SelectionTree(items, { getChildren }, { inverted: true, toggledItems: [items[0], { id: 'b' }] });
  expect(tree.getState()).toEqual({ inverted: true, toggledItems: [{ id: 'a' }] });
});

test('tracks items with trackBy', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  const getId = (item: { id: string }) => item.id;
  const getParentId = () => null;
  const { items, getChildren } = computeTreeItems(allItems, { getId, getParentId, dataGrouping: true }, null, null);
  const tree = new SelectionTree(
    items,
    { getChildren, trackBy: getId },
    { inverted: true, toggledItems: [items[0], { id: 'b' }] }
  );
  expect(tree.getState()).toEqual({ inverted: true, toggledItems: [{ id: 'a' }, { id: 'b' }] });
});
