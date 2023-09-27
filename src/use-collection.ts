// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useRef } from 'react';
import { processItems, processSelectedItems, itemsAreEqual } from './operations/index.js';
import { UseCollectionOptions, UseCollectionResult, CollectionRef, PropertyFilterOperator } from './interfaces';
import { createSyncProps } from './utils.js';
import { useCollectionState } from './use-collection-state.js';

export function useCollection<T, OperatorType extends string = PropertyFilterOperator>(
  allItems: ReadonlyArray<T>,
  options: UseCollectionOptions<T, OperatorType>
): UseCollectionResult<T, OperatorType> {
  const collectionRef = useRef<CollectionRef>(null);
  const [state, actions] = useCollectionState(options as any, collectionRef);
  const { items, allPageItems, pagesCount, filteredItemsCount, actualPageIndex } = processItems(
    allItems,
    state,
    options as any
  );
  if (options.selection && !options.selection.keepSelection) {
    const newSelectedItems = processSelectedItems(items as any, state.selectedItems as any, options.selection.trackBy);
    if (!itemsAreEqual(newSelectedItems, state.selectedItems as any, options.selection.trackBy)) {
      // This is a recommended pattern for how to handle the state, dependent on the incoming props
      // https://reactjs.org/docs/hooks-faq.html#how-do-i-implement-getderivedstatefromprops
      actions.setSelectedItems(newSelectedItems);
    }
  }
  return {
    items: items as any,
    allPageItems: allPageItems as any,
    filteredItemsCount,
    actions: actions as any,
    ...createSyncProps(options as any, state, actions, collectionRef, {
      actualPageIndex,
      pagesCount,
      allItems,
      allPageItems,
    }),
  } as any;
}
