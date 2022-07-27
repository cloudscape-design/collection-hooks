// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer } from 'react';
import { createActions, collectionReducer, CollectionReducer } from './utils.js';
import { UseCollectionOptions, CollectionState, CollectionActions, CollectionRef, Operator } from './interfaces';

export function useCollectionState<T, Op extends Operator>(
  options: UseCollectionOptions<T, Op>,
  collectionRef: React.RefObject<CollectionRef>
): readonly [CollectionState<T, Op>, CollectionActions<T, Op>] {
  const [state, dispatch] = useReducer<CollectionReducer<T, Op>>(collectionReducer, {
    selectedItems: options.selection?.defaultSelectedItems ?? [],
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
