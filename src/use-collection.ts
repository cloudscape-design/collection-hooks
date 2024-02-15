// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef } from './interfaces';
import { createSyncProps } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T>(allItems: ReadonlyArray<T>, options: UseCollectionOptions<T>): UseCollectionResult<T> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options, collectionRef);
  const { items, allPageItems, pagesCount, filteredItemsCount, actualPageIndex, itemsTree } = processItems(
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
  if (options.expandableRows) {
    const newExpandedGroups = new Set<string>();

    for (const item of items) {
      const itemKey = options.expandableRows.getId(item);

      if (state.expandedItems.has(itemKey)) {
        newExpandedGroups.add(itemKey);
      }
    }
    if (newExpandedGroups.size !== state.expandedItems.size) {
      actions.setExpandedItems(newExpandedGroups);
    }
  }

  return {
    items,
    allPageItems,
    filteredItemsCount,
    actions: {
      ...actions,
      setItemExpanded(item, expanded) {
        if (options.expandableRows) {
          const expandedItems = new Set(state.expandedItems);
          if (expanded) {
            expandedItems.add(options.expandableRows.getId(item));
          } else {
            expandedItems.delete(options.expandableRows.getId(item));
          }
          actions.setExpandedItems(expandedItems);
        }
      },
      setExpandedItems(items) {
        if (options.expandableRows) {
          const expandedItems = new Set<string>();
          for (const item of items) {
            expandedItems.add(options.expandableRows.getId(item));
          }
          actions.setExpandedItems(expandedItems);
        }
      },
    },
    ...createSyncProps(options, state, actions, collectionRef, {
      actualPageIndex,
      pagesCount,
      allItems,
      allPageItems,
      itemsTree,
    }),
  };
}
