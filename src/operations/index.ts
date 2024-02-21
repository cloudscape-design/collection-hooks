// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, CollectionState, TrackBy } from '../interfaces';
import { createFilterPredicate } from './filter.js';
import { createPropertyFilterPredicate } from './property-filter.js';
import { createComparator } from './sort.js';
import { createPageProps } from './pagination.js';
import { ItemsTree } from './items-tree.js';

export function processItems<T>(
  items: ReadonlyArray<T>,
  { filteringText, sortingState, currentPageIndex, propertyFilteringQuery }: Partial<CollectionState<T>>,
  { filtering, sorting, pagination, propertyFiltering, expandableRows }: UseCollectionOptions<T>
): {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  pagesCount: number | undefined;
  actualPageIndex: number | undefined;
  filteredItemsCount: number | undefined;
  itemsTree: ItemsTree<T>;
} {
  const itemsTree = new ItemsTree(items, expandableRows);

  const propertyFilterFn = propertyFiltering
    ? createPropertyFilterPredicate(propertyFiltering, propertyFilteringQuery ?? { tokens: [], operation: 'and' })
    : null;
  const textFilterFn = filtering ? createFilterPredicate(filtering, filteringText) : null;
  const filterFn = composeFilters([propertyFilterFn, textFilterFn]);
  if (filterFn) {
    itemsTree.filter(filterFn);
  }

  const comparator = sorting ? createComparator(sorting, sortingState) : null;
  if (comparator) {
    itemsTree.sort(comparator);
  }

  const allPageItems = itemsTree.getItems();
  const filteredItemsCount = filterFn ? itemsTree.getSize() : undefined;

  if (pagination) {
    const pageProps = createPageProps(pagination, currentPageIndex, items);
    if (pageProps) {
      items = items.slice((pageProps.pageIndex - 1) * pageProps.pageSize, pageProps.pageIndex * pageProps.pageSize);
    }
    return {
      items,
      allPageItems: allPageItems,
      filteredItemsCount,
      pagesCount: pageProps?.pagesCount,
      actualPageIndex: pageProps?.pageIndex,
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
