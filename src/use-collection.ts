// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef, useMemo } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef, PropertyFilterQuery } from './interfaces';
import { makeEvaluate } from './operations/property-filter.js';
import { createSyncProps, computeFilteringOptions } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T>(allItems: ReadonlyArray<T>, options: UseCollectionOptions<T>): UseCollectionResult<T> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options, collectionRef);
  const filteringProperties = options.propertyFiltering?.filteringProperties;
  const filteringFunction = useMemo(() => {
    const evaluate = makeEvaluate<T>(filteringProperties ?? []);
    return (item: T, query: PropertyFilterQuery) =>
      evaluate(item, { operation: query.operation, tokens: query.tokenGroups ?? query.tokens });
  }, [filteringProperties]);
  const {
    items,
    allPageItems,
    pagesCount,
    totalItemsCount,
    filteredItemsCount,
    actualPageIndex,
    selectedItems,
    expandableRows,
  } = processItems(allItems, state, options, filteringFunction);

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

  const filteringOptions = useMemo(
    () => computeFilteringOptions(allItems, filteringProperties),
    [allItems, filteringProperties]
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
