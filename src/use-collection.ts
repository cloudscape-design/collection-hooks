// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef } from 'react';
import { processItems, processSelectedItems, itemsAreEqual, getTrackableValue } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef } from './interfaces';
import { createSyncProps } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T>(allItems: ReadonlyArray<T>, options: UseCollectionOptions<T>): UseCollectionResult<T> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options, collectionRef);
  const { items, allPageItems, pagesCount, filteredItemsCount, actualPageIndex } = processItems(
    allItems,
    state,
    options
  );
  if (options.selection && !options.selection.keepSelection) {
    const newSelectedItems = processSelectedItems(items, state.selectedItems, options.selection.trackBy);
    if (!itemsAreEqual(newSelectedItems, state.selectedItems, options.selection.trackBy)) {
      // This is a recommended pattern for how to handle the state, dependent on the incoming props
      // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
      actions.setSelectedItems(newSelectedItems);
    }
  }

  // Removing expanded items that are no longer present in items.
  if (options.expandableItems) {
    const trackBy = options.expandableItems.trackBy;
    const getItemKey = (item: T) => (trackBy ? getTrackableValue(trackBy, item) : item);
    const newExpandedItems = new Array<T>();
    const existingKeys = new Set(state.expandedItems.map(getItemKey));

    for (const item of items) {
      if (existingKeys.has(getItemKey(item))) {
        newExpandedItems.push(item);
      }
    }
    if (newExpandedItems.length !== state.expandedItems.length) {
      actions.setExpandedItems(newExpandedItems);
    }
  }

  return {
    items,
    allPageItems,
    filteredItemsCount,
    actions,
    ...createSyncProps(options, state, actions, collectionRef, {
      actualPageIndex,
      pagesCount,
      allItems,
      allPageItems,
    }),
  };
}
