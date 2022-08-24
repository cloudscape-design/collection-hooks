// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef, PropertyFilterProperty } from './interfaces';
import { createSyncProps } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T, P extends PropertyFilterProperty = PropertyFilterProperty>(
  allItems: ReadonlyArray<T>,
  options: UseCollectionOptions<T, P>
): UseCollectionResult<T, P> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options, collectionRef);
  const { items, pagesCount, filteredItemsCount, actualPageIndex } = processItems(allItems, state, options);
  if (options.selection && !options.selection.keepSelection) {
    const newSelectedItems = processSelectedItems(items, state.selectedItems, options.selection.trackBy);
    if (!itemsAreEqual(newSelectedItems, state.selectedItems, options.selection.trackBy)) {
      // This is a recommended pattern for how to handle the state, dependent on the incoming props
      // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
      actions.setSelectedItems(newSelectedItems);
    }
  }
  return {
    items,
    filteredItemsCount,
    actions,
    ...createSyncProps(options, state, actions, collectionRef, {
      actualPageIndex,
      pagesCount,
      allItems,
    }),
  };
}
