// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer } from 'react';
import { createActions, collectionReducer } from './utils.js';
import { UseCollectionOptions, CollectionState, CollectionRef, CollectionActions } from './interfaces';

export function useCollectionState<T>(
  options: UseCollectionOptions<T>,
  collectionRef: React.RefObject<CollectionRef | null>
): readonly [CollectionState<T>, CollectionActions<T>] {
  const [state, dispatch] = useReducer(collectionReducer<T>, {
    selectedItems: options.selection?.defaultSelectedItems ?? [],
    expandedItems: options.expandableRows?.defaultExpandedItems ?? [],
    sortingState: options.sorting?.defaultState,
    currentPageIndex: options.pagination?.defaultPage ?? 1,
    filteringText: options.filtering?.defaultFilteringText ?? '',
    propertyFilteringQuery: options.propertyFiltering?.defaultQuery ?? { tokens: [], operation: 'and' },
  });
  return [
    state,
    createActions({
      dispatch,
      collectionRef,
    }),
  ] as const;
}
