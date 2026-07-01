// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer, useMemo } from 'react';
import { createActions, collectionReducer, CollectionReducer } from './utils.js';
import { UseCollectionOptions, CollectionState, CollectionRef, CollectionActions, SortingState } from './interfaces';
import { warnOnce } from './logging.js';

// Reconciles the two default-sort fields (mismatches can't be caught by the type) into the internal array shape.
function normalizeDefaultSorting<T>(sorting: UseCollectionOptions<T>['sorting']): ReadonlyArray<SortingState<T>> {
  if (!sorting) {
    return [];
  }
  if (sorting.multiColumn) {
    if (sorting.defaultSortingColumns) {
      return sorting.defaultSortingColumns;
    }
    if (sorting.defaultState) {
      warnOnce(
        'Use `sorting.defaultSortingColumns` (an array) instead of `sorting.defaultState` when `sorting.multiColumn` is enabled.'
      );
    }
    return [];
  }
  if (sorting.defaultSortingColumns) {
    warnOnce(
      '`sorting.defaultSortingColumns` is ignored unless `sorting.multiColumn` is enabled; use `sorting.defaultState` for single-column sorting.'
    );
  }
  return sorting.defaultState ? [sorting.defaultState] : [];
}

export function useCollectionState<T>(
  options: UseCollectionOptions<T>,
  collectionRef: React.RefObject<CollectionRef>
): readonly [CollectionState<T>, CollectionActions<T>] {
  const sorting = options.sorting;
  const initialSortingColumns: ReadonlyArray<SortingState<T>> = normalizeDefaultSorting(sorting);
  const [state, dispatch] = useReducer<CollectionReducer<T>>(collectionReducer, {
    selectedItems: options.selection?.defaultSelectedItems ?? [],
    expandedItems: options.expandableRows?.defaultExpandedItems ?? [],
    sortingColumns: initialSortingColumns,
    currentPageIndex: options.pagination?.defaultPage ?? 1,
    filteringText: options.filtering?.defaultFilteringText ?? '',
    propertyFilteringQuery: options.propertyFiltering?.defaultQuery ?? { tokens: [], operation: 'and' },
    groupSelection: { inverted: false, toggledItems: options.selection?.defaultSelectedItems ?? [] },
  });

  const actions = useMemo(() => createActions({ dispatch, collectionRef }), [dispatch, collectionRef]);

  return [state, actions] as const;
}
