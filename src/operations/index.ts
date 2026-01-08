// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, CollectionState, TrackBy } from '../interfaces';
import { createFilterPredicate } from './filter.js';
import { createPropertyFilterPredicate } from './property-filter.js';
import { createComparator } from './sort.js';
import { createPageProps } from './pagination.js';
import { composeFilters } from './compose-filters.js';
import { getTrackableValue } from './trackby-utils.js';
import { computeFlatItems, computeTreeItems } from './items-tree.js';

export function processItems<T>(
  allItems: ReadonlyArray<T>,
  { filteringText, sortingState, currentPageIndex, propertyFilteringQuery }: Partial<CollectionState<T>>,
  { filtering, sorting, pagination, propertyFiltering, expandableRows }: UseCollectionOptions<T>
): {
  items: readonly T[];
  allPageItems: readonly T[];
  pagesCount: number | undefined;
  actualPageIndex: number | undefined;
  filteredItemsCount: number | undefined;
  getChildren: (item: T) => T[];
} {
  const filterPredicate = composeFilters(
    createPropertyFilterPredicate(propertyFiltering, propertyFilteringQuery),
    createFilterPredicate(filtering, filteringText)
  );
  const sortingComparator = createComparator(sorting, sortingState);
  const { items, size, getChildren } = expandableRows
    ? computeTreeItems(allItems, expandableRows, filterPredicate, sortingComparator)
    : computeFlatItems(allItems, filterPredicate, sortingComparator);

  const filteredItemsCount = filterPredicate ? size : undefined;

  const pageProps = createPageProps(pagination, currentPageIndex, items);
  if (pageProps) {
    return {
      items: items.slice((pageProps.pageIndex - 1) * pageProps.pageSize, pageProps.pageIndex * pageProps.pageSize),
      allPageItems: items,
      filteredItemsCount,
      pagesCount: pageProps?.pagesCount,
      actualPageIndex: pageProps?.pageIndex,
      getChildren,
    };
  }

  return {
    items: items,
    allPageItems: items,
    filteredItemsCount,
    pagesCount: undefined,
    actualPageIndex: undefined,
    getChildren,
  };
}

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
