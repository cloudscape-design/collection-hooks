// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, CollectionState, TrackBy, TreeProps, ItemsTree } from '../interfaces';
import { filter } from './filter.js';
import { propertyFilter } from './property-filter.js';
import { sort } from './sort.js';
import { getPagesCount, normalizePageIndex, paginate } from './paginate.js';

export function processItems<T>(
  items: ReadonlyArray<T>,
  { filteringText, sortingState, currentPageIndex, propertyFilteringQuery, expandedItems }: Partial<CollectionState<T>>,
  { filtering, sorting, pagination, propertyFiltering, treeProps }: UseCollectionOptions<T>
): {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  pagesCount: number | undefined;
  actualPageIndex: number | undefined;
  filteredItemsCount: number | undefined;
  itemsTree: ItemsTree<T>;
} {
  let result = items;
  let pagesCount: number | undefined;
  let actualPageIndex: number | undefined;
  let filteredItemsCount: number | undefined;

  const itemsTree = createItemsTree(items, expandedItems ?? new Set(), treeProps);

  if (treeProps) {
    result = result.filter(item => itemsTree.isVisible(item));

    // TODO: create actual tree structure with support for filter and sort operations
    // run filtering and sorting on the tree instead of items array when the API is used
    // convert tree into a plain array once all operations are completed
  }

  if (propertyFiltering) {
    result = propertyFilter(result, propertyFilteringQuery || { tokens: [], operation: 'and' }, propertyFiltering);
    filteredItemsCount = result.length;
  }

  // TODO: join filter functions
  if (filtering) {
    result = filter(result, filteringText, filtering);
    filteredItemsCount = result.length;
  }

  // TODO: join filters and find rem items
  // TODO: use rem items to keep items and their parents

  // TODO: create comparator
  // TODO: enhance comparator with tree comparator
  if (sorting) {
    result = sort(result, sortingState);
  }

  const allPageResult = result;
  if (pagination) {
    pagesCount = getPagesCount(result, pagination.pageSize);
    actualPageIndex = normalizePageIndex(currentPageIndex, pagesCount);
    result = paginate(result, actualPageIndex, pagination.pageSize);
  }

  return { items: result, allPageItems: allPageResult, pagesCount, filteredItemsCount, actualPageIndex, itemsTree };
}

export const getTrackableValue = <T>(trackBy: TrackBy<T> | undefined, item: T) => {
  if (!trackBy) {
    return item;
  }
  if (typeof trackBy === 'function') {
    return trackBy(item);
  }
  return (item as any)[trackBy];
};

export const processSelectedItems = <T>(
  items: ReadonlyArray<T>,
  selectedItems: ReadonlyArray<T>,
  trackBy?: TrackBy<T>
): T[] => {
  const selectedSet = new Set();
  selectedItems.forEach(item => selectedSet.add(getTrackableValue(trackBy, item)));
  return items.filter(item => selectedSet.has(getTrackableValue(trackBy, item)));
};

export const itemsAreEqual = <T>(items1: ReadonlyArray<T>, items2: ReadonlyArray<T>, trackBy?: TrackBy<T>): boolean => {
  if (items1.length !== items2.length) {
    return false;
  }
  const set1 = new Set();
  items1.forEach(item => set1.add(getTrackableValue(trackBy, item)));
  return items2.every(item => set1.has(getTrackableValue(trackBy, item)));
};

export function createItemsTree<T>(
  items: ReadonlyArray<T>,
  expandedItems: ReadonlySet<string>,
  treeProps?: TreeProps<T>
): ItemsTree<T> {
  if (!treeProps) {
    return {
      isVisible: () => true,
      getLevel: () => 1,
      hasChildren: () => false,
    };
  }
  const { getId, getParentId } = treeProps;

  const rootItems: T[] = [];
  const itemIdToItem = new Map<string, T>();
  const itemIdToLevel = new Map<string, number>();
  const itemIdToChildren = new Map<string, number>();
  const itemToHidden = new Map<string, boolean>();

  for (let index = 0; index < items.length; index++) {
    const item = items[index];
    const itemId = getId(item);
    const itemParentId = getParentId(item);

    if (itemParentId === null) {
      rootItems.push(item);
    }
    itemIdToItem.set(itemId, item);
  }

  function traverse(item: T, fn: (item: T, parent: null | T) => void) {
    const itemId = getId(item);
    const parentId = getParentId(item);

    if (parentId === null) {
      fn(item, null);
      return;
    }

    const parent = itemIdToItem.get(parentId);
    const parentHidden = itemToHidden.get(parentId) ?? false;
    if (parentHidden || !expandedItems.has(parentId)) {
      itemToHidden.set(itemId, true);
    }

    if (parent) {
      if (itemIdToLevel.get(parentId) === undefined) {
        traverse(parent, fn);
      }

      fn(item, parent);
    }
  }

  for (const rootItem of items) {
    traverse(rootItem, (item, parent) => {
      const itemId = getId(item);

      if (!parent) {
        itemIdToLevel.set(itemId, 1);
      } else {
        const parentId = getId(parent);
        const parentLevel = itemIdToLevel.get(parentId)!;

        itemIdToLevel.set(itemId, parentLevel + 1);
        itemIdToChildren.set(parentId, (itemIdToChildren.get(parentId) ?? 0) + 1);
      }
    });
  }

  return {
    isVisible: (item: T) => itemToHidden.get(getId(item)) !== true,
    getLevel: (item: T) => itemIdToLevel.get(getId(item)) ?? 1,
    hasChildren: (item: T) => (itemIdToChildren.get(getId(item)) ?? 0) > 0,
  };
}
