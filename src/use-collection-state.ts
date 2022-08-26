// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer } from 'react';
import { createActions, collectionReducer, CollectionReducer } from './utils.js';
import {
  UseCollectionOptions,
  CollectionState,
  CollectionActions,
  CollectionRef,
  PropertyFilterProperty,
} from './interfaces';

export function useCollectionState<T, P extends PropertyFilterProperty>(
  options: UseCollectionOptions<T, P>,
  collectionRef: React.RefObject<CollectionRef>
): readonly [CollectionState<T>, CollectionActions<T>] {
  const [state, dispatch] = useReducer<CollectionReducer<T>>(collectionReducer, {
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
