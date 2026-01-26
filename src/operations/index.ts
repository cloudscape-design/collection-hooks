// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { UseCollectionOptions, CollectionState, TrackBy } from '../interfaces';
import { createFilterPredicate } from './filter.js';
import { createPropertyFilterPredicate } from './property-filter.js';
import { createComparator } from './sort.js';
import { createPageProps } from './pagination.js';
import { composeFilters } from './compose-filters.js';
import { getTrackableValue, SelectionTree } from '@cloudscape-design/component-toolkit/internal';
import { computeFlatItems, computeTreeItems } from './items-tree.js';

export function processItems<T>(
  allItems: ReadonlyArray<T>,
  state: Partial<CollectionState<T>>,
  { filtering, sorting, pagination, propertyFiltering, expandableRows, selection }: UseCollectionOptions<T>
): {
  items: readonly T[];
  allPageItems: readonly T[];
  pagesCount: number | undefined;
  actualPageIndex: number | undefined;
  totalItemsCount: number;
  filteredItemsCount: number | undefined;
  selectedItems: undefined | T[];
  getItemsCount?: (item: T) => number;
  getSelectedItemsCount?: (item: T) => number;
  getChildren: (item: T) => T[];
} {
  const filterPredicate = composeFilters(
    createPropertyFilterPredicate(propertyFiltering, state.propertyFilteringQuery),
    createFilterPredicate(filtering, state.filteringText)
  );
  const sortingComparator = createComparator(sorting, state.sortingState);
  const { items, totalItemsCount, getChildren, getItemsCount } = expandableRows
    ? computeTreeItems(allItems, expandableRows, filterPredicate, sortingComparator)
    : computeFlatItems(allItems, filterPredicate, sortingComparator);
  const filteredItemsCount = filterPredicate ? totalItemsCount : undefined;

  let getSelectedItemsCount: undefined | ((item: T) => number) = undefined;
  let selectedItems: undefined | T[] = undefined;
  if (selection && expandableRows?.dataGrouping && state.groupSelection) {
    const trackBy = selection?.trackBy ?? expandableRows?.getId;
    const selectionTreeProps = { getChildren: getChildren, trackBy };
    const selectionTree = new SelectionTree(items, selectionTreeProps, state.groupSelection);
    getSelectedItemsCount = selectionTree.getSelectedItemsCount;
    selectedItems = selectionTree.getSelectedItems();
  }

  const pageProps = createPageProps(pagination, state.currentPageIndex, items);
  if (pageProps) {
    return {
      items: items.slice((pageProps.pageIndex - 1) * pageProps.pageSize, pageProps.pageIndex * pageProps.pageSize),
      allPageItems: items,
      totalItemsCount,
      filteredItemsCount,
      pagesCount: pageProps?.pagesCount,
      actualPageIndex: pageProps?.pageIndex,
      selectedItems,
      getItemsCount,
      getSelectedItemsCount,
      getChildren,
    };
  }

  return {
    items: items,
    allPageItems: items,
    totalItemsCount,
    filteredItemsCount,
    pagesCount: undefined,
    actualPageIndex: undefined,
    selectedItems,
    getItemsCount,
    getSelectedItemsCount,
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
