// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef, useState } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef } from './interfaces';
import { createSyncProps } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T>(allItems: ReadonlyArray<T>, options: UseCollectionOptions<T>): UseCollectionResult<T> {
  const collectionRef = useRef<CollectionRef>(null);
  const allAcrossPagesRef = useRef(false);
  const [allAcrossPages, setAllAcrossPages] = useState(false);
  const setAllAcrossPagesSync = (value: boolean) => {
    allAcrossPagesRef.current = value;
    setAllAcrossPages(value);
  };
  const [lastAllMatchingItems, setLastAllMatchingItems] = useState<ReadonlyArray<T>>([]);
  const [state, baseActions] = useCollectionState(options, collectionRef);

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

  // Wrap actions to track cross-page selection
  const resetAcrossPages = () => setAllAcrossPagesSync(false);
  const actions: typeof baseActions = {
    ...baseActions,
    setSelectedItems(selectedItems) {
      resetAcrossPages();
      baseActions.setSelectedItems(selectedItems);
    },
    setFiltering(filteringText) {
      resetAcrossPages();
      baseActions.setFiltering(filteringText);
    },
    setPropertyFiltering(query) {
      resetAcrossPages();
      baseActions.setPropertyFiltering(query);
    },
    setSorting(state) {
      resetAcrossPages();
      baseActions.setSorting(state);
    },
    setCurrentPage(pageNumber) {
      // Don't reset cross-page selection when navigating pages
      if (!allAcrossPagesRef.current) {
        resetAcrossPages();
      }
      baseActions.setCurrentPage(pageNumber);
    },
    selectAllAcrossPages() {
      setAllAcrossPagesSync(true);
      // Select all items that match the last selection criteria across all pages
      baseActions.setSelectedItems(
        lastAllMatchingItems.length > 0 ? lastAllMatchingItems : (allPageItems as ReadonlyArray<T>)
      );
    },
  };

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

  // Removing selected items that are no longer present in items unless keepSelection=true or cross-page selection is active.
  if (options.selection && !options.selection.keepSelection && !allAcrossPagesRef.current) {
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
  // Wrap onSelectionControllerItemClick to capture allMatchingItems for cross-page selection
  const wrappedOptions = { ...options };
  if (options.selection?.onSelectionControllerItemClick) {
    const originalCallback = options.selection.onSelectionControllerItemClick;
    wrappedOptions.selection = {
      ...options.selection,
      onSelectionControllerItemClick: (detail, visibleItems, hookActions, allItems) => {
        const result = originalCallback(detail, visibleItems, hookActions, allItems);
        if (result && 'allMatchingItems' in result) {
          setLastAllMatchingItems(result.allMatchingItems);
        } else {
          setLastAllMatchingItems([]);
        }
        return result;
      },
    };
  }

  const syncProps = createSyncProps(wrappedOptions, extendedState, actions, collectionRef, {
    actualPageIndex,
    pagesCount,
    allItems,
    allPageItems,
    visibleItems,
    totalItemsCount,
    expandableRows,
    allAcrossPages,
    lastAllMatchingItems,
  });

  return {
    items,
    allPageItems,
    filteredItemsCount,
    actions,
    crossPageSelectionState: syncProps.crossPageSelectionState,
    ...syncProps,
  };
}
