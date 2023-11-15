// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, CollectionState, TrackBy } from '../interfaces';
import { createFilterPredicate } from './filter.js';
import { createPropertyFilterPredicate } from './property-filter.js';
import { sort } from './sort.js';
import { getPagesCount, normalizePageIndex, paginate } from './paginate.js';
import { composeFilters } from './compose-filters';

export function processItems<T>(
  items: ReadonlyArray<T>,
  { filteringText, sortingState, currentPageIndex, propertyFilteringQuery }: Partial<CollectionState<T>>,
  { filtering, sorting, pagination, propertyFiltering }: UseCollectionOptions<T>
): {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  pagesCount: number | undefined;
  actualPageIndex: number | undefined;
  filteredItemsCount: number | undefined;
} {
  let result = items;
  let pagesCount: number | undefined;
  let actualPageIndex: number | undefined;
  let filteredItemsCount: number | undefined;

  const filterPredicate = composeFilters(
    createPropertyFilterPredicate(propertyFiltering, propertyFilteringQuery),
    createFilterPredicate(filtering, filteringText)
  );

  if (filterPredicate) {
    result = result.filter(filterPredicate);
    filteredItemsCount = result.length;
  }

  if (sorting) {
    result = sort(result, sortingState);
  }

  const allPageResult = result;
  if (pagination) {
    pagesCount = getPagesCount(result, pagination.pageSize);
    actualPageIndex = normalizePageIndex(currentPageIndex, pagesCount);
    result = paginate(result, actualPageIndex, pagination.pageSize);
  }

  return { items: result, allPageItems: allPageResult, pagesCount, filteredItemsCount, actualPageIndex };
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
