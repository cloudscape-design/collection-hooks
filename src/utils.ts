// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Dispatch, Reducer, ReactNode } from 'react';
import { FilteringOptions } from '.';
import {
  CollectionActions,
  UseCollectionOptions,
  CollectionState,
  SortingState,
  UseCollectionResult,
  CollectionRef,
  Query,
  PropertyFilteringOption,
  Operator,
  FilteringProperty,
} from './interfaces';
import { fixupFalsyValues } from './operations/property-filter.js';

interface SelectionAction<T> {
  type: 'selection';
  selectedItems: ReadonlyArray<T>;
}
interface SortingAction<T> {
  type: 'sorting';
  sortingState: SortingState<T>;
}
interface PaginationAction {
  type: 'pagination';
  pageIndex: number;
}
interface FilteringAction {
  type: 'filtering';
  filteringText: string;
}
interface PropertyFilteringAction<Op extends Operator> {
  type: 'property-filtering';
  query: Query<Op>;
}
type Action<T, Op extends Operator> =
  | SelectionAction<T>
  | SortingAction<T>
  | PaginationAction
  | FilteringAction
  | PropertyFilteringAction<Op>;
export type CollectionReducer<T, Op extends Operator> = Reducer<CollectionState<T, Op>, Action<T, Op>>;
export function collectionReducer<T, Op extends Operator>(
  state: CollectionState<T, Op>,
  action: Action<T, Op>
): CollectionState<T, Op> {
  const newState = { ...state };
  switch (action.type) {
    case 'selection':
      newState.selectedItems = action.selectedItems;
      break;
    case 'filtering':
      newState.currentPageIndex = 1;
      newState.filteringText = action.filteringText;
      break;
    case 'sorting':
      newState.currentPageIndex = 1;
      newState.sortingState = action.sortingState;
      break;
    case 'pagination':
      newState.currentPageIndex = action.pageIndex;
      break;
    case 'property-filtering':
      newState.currentPageIndex = 1;
      newState.propertyFilteringQuery = action.query;
      break;
  }
  return newState;
}

export function createActions<T, Op extends Operator>({
  dispatch,
  collectionRef,
}: {
  dispatch: Dispatch<Action<T, Op>>;
  collectionRef: React.RefObject<CollectionRef>;
}): CollectionActions<T, Op> {
  return {
    setFiltering(filteringText) {
      dispatch({ type: 'filtering', filteringText });
      collectionRef.current && collectionRef.current.scrollToTop();
    },
    setSorting(state: SortingState<T>) {
      dispatch({ type: 'sorting', sortingState: state });
      collectionRef.current && collectionRef.current.scrollToTop();
    },
    setCurrentPage(pageIndex: number) {
      dispatch({ type: 'pagination', pageIndex });
      collectionRef.current && collectionRef.current.scrollToTop();
    },
    setSelectedItems(selectedItems: Array<T>) {
      dispatch({ type: 'selection', selectedItems });
    },
    setPropertyFiltering(query: Query<Op>) {
      dispatch({ type: 'property-filtering', query });
      collectionRef.current && collectionRef.current.scrollToTop();
    },
  };
}

export function createSyncProps<T, Op extends Operator>(
  options: UseCollectionOptions<T, Op>,
  { filteringText, sortingState, selectedItems, currentPageIndex, propertyFilteringQuery }: CollectionState<T, Op>,
  actions: CollectionActions<T, Op>,
  collectionRef: React.RefObject<CollectionRef>,
  {
    pagesCount,
    actualPageIndex,
    allItems,
  }: { pagesCount?: number; actualPageIndex?: number; allItems: ReadonlyArray<T> }
): Pick<UseCollectionResult<T, Op>, 'collectionProps' | 'filterProps' | 'paginationProps' | 'propertyFilterProps'> {
  let empty: ReactNode | null = options.filtering
    ? allItems.length
      ? options.filtering.noMatch
      : options.filtering.empty
    : null;
  empty = options.propertyFiltering
    ? allItems.length
      ? options.propertyFiltering.noMatch
      : options.propertyFiltering.empty
    : empty;
  const filteringOptions = options.propertyFiltering
    ? options.propertyFiltering.filteringProperties.reduce<PropertyFilteringOption[]>((acc, property) => {
        Object.keys(
          allItems.reduce<{ [key in string]: boolean }>((acc, item) => {
            acc['' + fixupFalsyValues(item[property.key as keyof T])] = true;
            return acc;
          }, {})
        ).forEach(value => {
          if (value !== '') {
            acc.push({
              propertyKey: property.key,
              value,
            });
          }
        });
        return acc;
      }, [])
    : [];
  return {
    collectionProps: {
      empty,
      ...(options.sorting
        ? {
            onSortingChange: ({ detail }) => {
              actions.setSorting(detail);
            },
            sortingColumn: sortingState?.sortingColumn,
            sortingDescending: sortingState?.isDescending,
          }
        : {}),
      ...(options.selection
        ? {
            onSelectionChange: ({ detail: { selectedItems } }) => {
              actions.setSelectedItems(selectedItems);
            },
            selectedItems,
            trackBy: options.selection.trackBy,
          }
        : {}),
      ref: collectionRef,
    },
    filterProps: {
      filteringText,
      onChange: ({ detail: { filteringText } }) => {
        actions.setFiltering(filteringText);
      },
    },
    propertyFilterProps: {
      query: propertyFilteringQuery,
      onChange: ({ detail: query }) => {
        actions.setPropertyFiltering(query);
      },
      filteringProperties: options.propertyFiltering?.filteringProperties || [],
      filteringOptions,
    },
    paginationProps: {
      currentPageIndex: actualPageIndex ?? currentPageIndex,
      // pagesCount is always calculated when options.pagination is present
      pagesCount: pagesCount!,
      onChange: ({ detail: { currentPageIndex } }) => {
        actions.setCurrentPage(currentPageIndex);
      },
    },
  };
}
