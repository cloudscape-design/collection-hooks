// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DataGroupingProps } from '../interfaces';

interface TreeProps<T> {
  getId(item: T): string;
  getParentId(item: T): null | string;
  dataGrouping?: DataGroupingProps;
}

export function computeFlatItems<T>(
  items: readonly T[],
  filterPredicate: null | ((item: T) => boolean),
  sortingComparator: null | ((a: T, b: T) => number)
) {
  if (filterPredicate) {
    items = items.filter(filterPredicate);
  }
  if (sortingComparator) {
    items = items.slice().sort(sortingComparator);
  }
  return {
    items,
    rootItemsCount: items.length,
    selectableItemsCount: items.length,
    getItemChildren: undefined,
    isItemExpandable: undefined,
    getItemsCount: undefined,
  };
}

export function computeTreeItems<T>(
  allItems: readonly T[],
  treeProps: TreeProps<T>,
  filterPredicate: null | ((item: T) => boolean),
  sortingComparator: null | ((a: T, b: T) => number)
) {
  const idToChildren = new Map<string, T[]>();
  const idToCount = new Map<string, number>();
  let items: T[] = [];
  let rootItemsCount = 0;
  let selectableItemsCount = 0;

  for (const item of allItems) {
    const parentId = treeProps.getParentId(item);
    if (parentId === null) {
      items.push(item);
    } else {
      const children = idToChildren.get(parentId) ?? [];
      children.push(item);
      idToChildren.set(parentId, children);
    }
  }
  const getItemChildren = (item: T) => idToChildren.get(treeProps.getId(item)) ?? [];
  const setChildren = (item: T, children: T[]) => idToChildren.set(treeProps.getId(item), children);
  const isItemExpandable = (item: T) => getItemChildren(item)?.length > 0;

  if (filterPredicate) {
    const filterNode = (item: T): boolean => {
      const children = getItemChildren(item);
      const filteredChildren = children.filter(filterNode);
      setChildren(item, filteredChildren);
      return filterPredicate(item) || filteredChildren.length > 0;
    };
    items = items.filter(filterNode);
  }

  if (sortingComparator) {
    const sortLevel = (levelItems: T[]) => {
      levelItems.sort(sortingComparator);
      for (const item of levelItems) {
        sortLevel(getItemChildren(item));
      }
    };
    sortLevel(items);
  }

  function computeSelectableCount(item: T) {
    const children = getItemChildren(item);
    // In grouped table, we count all leaf nodes as selectable.
    let itemCount = children.length === 0 ? 1 : 0;
    for (const child of children) {
      itemCount += computeSelectableCount(child);
    }
    idToCount.set(treeProps.getId(item), itemCount);
    return itemCount;
  }
  for (const item of items) {
    rootItemsCount += 1;
    selectableItemsCount += computeSelectableCount(item);
  }
  const getItemsCount = treeProps.dataGrouping ? (item: T) => idToCount.get(treeProps.getId(item)) ?? 0 : undefined;

  return { items, rootItemsCount, selectableItemsCount, getItemChildren, isItemExpandable, getItemsCount };
}
