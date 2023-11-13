// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, CollectionState, TrackBy } from '../interfaces';
import { createFilter } from './filter.js';
import { createPropertyFilter } from './property-filter.js';
import { createComparator } from './sort.js';
import { getPagesCount, normalizePageIndex, paginate } from './paginate.js';
import { ItemsTree } from './items-tree.js';

export function processItems<T>(
  items: ReadonlyArray<T>,
  { filteringText, sortingState, currentPageIndex, propertyFilteringQuery, groupPages }: Partial<CollectionState<T>>,
  { filtering, sorting, pagination, groupPagination, propertyFiltering, treeProps }: UseCollectionOptions<T>
): {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  pagesCount: number | undefined;
  actualPageIndex: number | undefined;
  filteredItemsCount: number | undefined;
  itemsTree: ItemsTree<T>;
} {
  const itemsTree = new ItemsTree(items, treeProps);

  const filter = composeFilters([
    propertyFiltering
      ? createPropertyFilter(propertyFilteringQuery || { tokens: [], operation: 'and' }, propertyFiltering)
      : null,
    filtering ? createFilter(filteringText, filtering) : null,
  ]);
  if (filter) {
    itemsTree.filter(filter);
  }

  const comparator = sorting ? createComparator(sortingState) : null;
  if (comparator) {
    itemsTree.sort(comparator);
  }

  const allPageItems = itemsTree.getItems();
  const filteredItemsCount = filter ? itemsTree.getSize() : undefined;

  if (pagination) {
    const pagesCount = getPagesCount(allPageItems, pagination.pageSize);
    const actualPageIndex = normalizePageIndex(currentPageIndex, pagesCount);
    const getPageSize = (item: null | T): number => {
      if (!item) {
        return pagination.pageSize ?? Number.POSITIVE_INFINITY;
      }
      if (groupPagination) {
        return groupPagination.pageSize(item);
      }
      return Number.POSITIVE_INFINITY;
    };
    const getPageItems = (item: null | T): number => {
      let page = 1;

      if (item && groupPages) {
        const itemId = treeProps?.getId(item);
        if (itemId) {
          page = groupPages.get(itemId) ?? 1;
        }
      }

      if (!item) {
        page = currentPageIndex ?? 1;
      }

      return page * getPageSize(item);
    };
    const paginatedItems = groupPagination
      ? itemsTree.paginate(getPageItems).getItems()
      : paginate(allPageItems, actualPageIndex, pagination.pageSize);
    return {
      items: paginatedItems,
      allPageItems: allPageItems,
      filteredItemsCount,
      pagesCount,
      actualPageIndex,
      itemsTree,
    };
  }

  return {
    items: allPageItems,
    allPageItems: allPageItems,
    filteredItemsCount,
    pagesCount: undefined,
    actualPageIndex: undefined,
    itemsTree,
  };
}

export const getTrackableValue = <T>(trackBy: TrackBy<T> | undefined, item: T): string | T => {
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

type Filter<T> = (item: T) => boolean;

function composeFilters<T>(filters: Array<null | Filter<T>>): null | Filter<T> {
  const definedFilters: Filter<T>[] = [];
  for (const filter of filters) {
    if (filter) {
      definedFilters.push(filter);
    }
  }
  if (definedFilters.length === 0) {
    return null;
  }
  return definedFilters.reduce(
    (composedFilter, filter) => (item: T) => composedFilter(item) && filter(item),
    () => true
  );
}
