// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef, useMemo } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { makeFilteringPropertiesMap, makeDefaultFilteringFunction } from './operations/property-filter.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef } from './interfaces';
import { createSyncProps, computeFilteringOptions } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T>(allItems: ReadonlyArray<T>, options: UseCollectionOptions<T>): UseCollectionResult<T> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options, collectionRef);

  const filteringProperties = options.propertyFiltering?.filteringProperties;

  const filteringPropertiesMap = useMemo(
    () => (filteringProperties ? makeFilteringPropertiesMap<T>(filteringProperties) : undefined),
    [filteringProperties]
  );

  const defaultFilteringFunction = useMemo(
    () => (filteringPropertiesMap ? makeDefaultFilteringFunction<T>(filteringPropertiesMap) : undefined),
    [filteringPropertiesMap]
  );

  const propertyFilterPredicate = useMemo(
    () => (defaultFilteringFunction ? (item: T) => defaultFilteringFunction(item, state.propertyFilteringQuery) : null),
    [defaultFilteringFunction, state.propertyFilteringQuery]
  );

  const {
    items,
    allPageItems,
    pagesCount,
    totalItemsCount,
    filteredItemsCount,
    actualPageIndex,
    selectedItems,
    expandableRows,
  } = processItems(allItems, state, options, filteringPropertiesMap, defaultFilteringFunction, propertyFilterPredicate);

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

  // When normal selection is used, the selectedItems are taken from state.
  // When group selection is used, the selectedItems are derived from group selection state.
  const extendedState = selectedItems ? { ...state, selectedItems } : state;

  const filteringOptionsRef = useRef<{
    allItems: ReadonlyArray<T> | null;
    filteringProperties: typeof filteringProperties | null;
    result: ReturnType<typeof computeFilteringOptions>;
  }>({ allItems: null, filteringProperties: null, result: [] });
  if (
    filteringOptionsRef.current.allItems !== allItems ||
    filteringOptionsRef.current.filteringProperties !== filteringProperties
  ) {
    filteringOptionsRef.current = {
      allItems,
      filteringProperties,
      result: computeFilteringOptions(allItems, filteringProperties),
    };
  }
  const filteringOptions = filteringOptionsRef.current.result;

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
