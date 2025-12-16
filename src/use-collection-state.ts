// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer, useMemo } from 'react';
import { createActions, collectionReducer, CollectionReducer } from './utils.js';
import { UseCollectionOptions, CollectionState, CollectionRef, CollectionActions } from './interfaces';

export function useCollectionState<T>(
  options: UseCollectionOptions<T>,
  collectionRef: React.RefObject<CollectionRef>
): readonly [CollectionState<T>, CollectionActions<T>] {
  const [state, dispatch] = useReducer<CollectionReducer<T>>(collectionReducer, {
    selectedItems: options.selection?.defaultSelectedItems ?? [],
    expandedItems: options.expandableRows?.defaultExpandedItems ?? [],
    sortingState: options.sorting?.defaultState,
    currentPageIndex: options.pagination?.defaultPage ?? 1,
    filteringText: options.filtering?.defaultFilteringText ?? '',
    propertyFilteringQuery: options.propertyFiltering?.defaultQuery ?? { tokens: [], operation: 'and' },
    groupSelection: options.selection?.defaultSelectedItems
      ? { inverted: false, toggledItems: options.selection.defaultSelectedItems }
      : { inverted: false, toggledItems: [] },
  });

  const actions = useMemo(() => createActions({ dispatch, collectionRef }), [dispatch, collectionRef]);

  return [state, actions] as const;
}
