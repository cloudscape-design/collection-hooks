// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { useReducer, useMemo } from 'react';
import { createActions, collectionReducer, CollectionReducer } from './utils.js';
import { UseCollectionOptions, CollectionState, CollectionRef, CollectionActions, SortingState } from './interfaces';
import { warnOnce } from './logging.js';

// Normalizes the polymorphic `sorting.defaultState` option into the internal always-array shape.
// The `sorting` option is a discriminated union: `defaultState` is a single descriptor in single-column
// mode and an array in multi-column mode. TypeScript enforces this, but for untyped (JS) consumers we
// verify the runtime shape and emit a dev-only warning on a mismatch, recovering gracefully so a wrong
// shape never throws in production.
function isSortingStateArray<T>(
  value: SortingState<T> | ReadonlyArray<SortingState<T>>
): value is ReadonlyArray<SortingState<T>> {
  return Array.isArray(value);
}

function normalizeDefaultSorting<T>(sorting: UseCollectionOptions<T>['sorting']): ReadonlyArray<SortingState<T>> {
  if (!sorting || sorting.defaultState === undefined) {
    return [];
  }
  const defaultState: SortingState<T> | ReadonlyArray<SortingState<T>> = sorting.defaultState;
  if (sorting.multiColumn) {
    if (isSortingStateArray(defaultState)) {
      return defaultState;
    }
    warnOnce('`sorting.defaultState` must be an array of sorting states when `sorting.multiColumn` is enabled.');
    return [defaultState];
  }
  if (isSortingStateArray(defaultState)) {
    warnOnce('`sorting.defaultState` must be a single sorting state unless `sorting.multiColumn` is enabled.');
    return defaultState.slice(0, 1);
  }
  return [defaultState];
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
