// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer } from 'react';
import { createActions, collectionReducer, CollectionReducer } from './utils.js';
import { UseCollectionOptions, CollectionState, InternalCollectionActions, CollectionRef } from './interfaces';

export function useCollectionState<T>(
  options: UseCollectionOptions<T>,
  collectionRef: React.RefObject<CollectionRef>
): readonly [CollectionState<T>, InternalCollectionActions<T>] {
  const [state, dispatch] = useReducer<CollectionReducer<T>>(collectionReducer, {
    selectedItems: options.selection?.defaultSelectedItems ?? [],
    expandedItems: transformExpandedItems(options),
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

function transformExpandedItems<T>(options: UseCollectionOptions<T>): ReadonlySet<string> {
  const expandableRows = new Set<string>();
  if (options.expandableRows && options.expandableRows.defaultExpandedItems) {
    for (const item of options.expandableRows.defaultExpandedItems) {
      expandableRows.add(options.expandableRows.getId(item));
    }
  }
  return expandableRows;
}
