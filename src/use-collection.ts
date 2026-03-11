// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef, useMemo } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef } from './interfaces';
import { createSyncProps, computeFilteringOptions } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T>(allItems: ReadonlyArray<T>, options: UseCollectionOptions<T>): UseCollectionResult<T> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options, collectionRef);
  const {
    items,
    allPageItems,
    pagesCount,
    totalItemsCount,
    filteredItemsCount,
    actualPageIndex,
    selectedItems,
    expandableRows,
  } = processItems(allItems, state, options);

  const expandedItemsSet = new Set<string>();
  if (options.expandableRows) {
    for (const item of state.expandedItems) {
      expandedItemsSet.add(options.expandableRows.getId(item));
    }
  }

  let visibleItems = items;
  if (options.expandableRows) {
    const flatItems = new Array<T>();
    const getId = options.expandableRows.getId;
    const traverse = (items: readonly T[]) => {
      for (const item of items) {
        flatItems.push(item);
        if (expandableRows && expandedItemsSet.has(getId(item))) {
          traverse(expandableRows.getItemChildren(item));
        }
      }
    };
    traverse(items);
    visibleItems = flatItems;
  }

  // Removing selected items that are no longer present in items unless keepSelection=true.
  if (options.selection && !options.selection.keepSelection) {
    const newSelectedItems = processSelectedItems(visibleItems, state.selectedItems, options.selection.trackBy);
    if (!itemsAreEqual(newSelectedItems, state.selectedItems, options.selection.trackBy)) {
      // This is a recommended pattern for how to handle the state, dependent on the incoming props
      // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
      actions.setSelectedItems(newSelectedItems);
    }
  }

  // Removing expanded items that are no longer present in items.
  if (options.expandableRows) {
    const newExpandedItems = visibleItems.filter(item => expandedItemsSet.has(options.expandableRows!.getId(item)));
    if (!itemsAreEqual(newExpandedItems, state.expandedItems, options.expandableRows.getId)) {
      actions.setExpandedItems(newExpandedItems);
    }
  }

  // Memoize `computeFilteringOptions` scan so it only runs when `allItems` or
  // `filteringProperties` change. When the caller supplies
  // `options.propertyFiltering.filteringOptions`, the scan is skipped entirely
  // and the pre-computed list is returned directly.
  const filteringProperties = options.propertyFiltering?.filteringProperties;
  const precomputedOptions = options.propertyFiltering?.filteringOptions;
  const filteringOptions = useMemo(
    () => computeFilteringOptions(allItems, filteringProperties, precomputedOptions),
    // filteringProperties and precomputedOptions are typically stable references (defined outside render or
    // wrapped in useMemo by the caller), so array-identity comparison is correct here.
    [allItems, filteringProperties, precomputedOptions]
  );

  // When normal selection is used, the selectedItems are taken from state.
  // When group selection is used, the selectedItems are derived from group selection state.
  const extendedState = selectedItems ? { ...state, selectedItems } : state;
  return {
    items,
    allPageItems,
    filteredItemsCount,
    actions,
    ...createSyncProps(options, extendedState, actions, collectionRef, {
      actualPageIndex,
      pagesCount,
      allItems,
      totalItemsCount,
      expandableRows,
      filteringOptions,
    }),
  };
}
