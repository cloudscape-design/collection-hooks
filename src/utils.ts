// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Dispatch, Reducer, ReactNode } from 'react';
import {
  UseCollectionOptions,
  CollectionState,
  SortingState,
  UseCollectionResult,
  CollectionRef,
  PropertyFilterQuery,
  PropertyFilterOption,
  InternalCollectionActions,
} from './interfaces';
import { fixupFalsyValues } from './operations/property-filter.js';

interface SelectionAction<T> {
  type: 'selection';
  selectedItems: ReadonlyArray<T>;
}
interface ExpandAction {
  type: 'expand';
  expandedGroups: Iterable<string>;
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
interface PropertyFilteringAction {
  type: 'property-filtering';
  query: PropertyFilterQuery;
}
type Action<T> =
  | SelectionAction<T>
  | ExpandAction
  | SortingAction<T>
  | PaginationAction
  | FilteringAction
  | PropertyFilteringAction;
export type CollectionReducer<T> = Reducer<CollectionState<T>, Action<T>>;
export function collectionReducer<T>(state: CollectionState<T>, action: Action<T>): CollectionState<T> {
  const newState = { ...state };
  switch (action.type) {
    case 'selection':
      newState.selectedItems = action.selectedItems;
      break;
    case 'expand':
      newState.expandedGroups = new Set(action.expandedGroups);
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

export function createActions<T>({
  dispatch,
  collectionRef,
}: {
  dispatch: Dispatch<Action<T>>;
  collectionRef: React.RefObject<CollectionRef>;
}): InternalCollectionActions<T> {
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
    setExpandedGroups(expandedGroups: Iterable<string>) {
      dispatch({ type: 'expand', expandedGroups });
    },
    setPropertyFiltering(query: PropertyFilterQuery) {
      dispatch({ type: 'property-filtering', query });
      collectionRef.current && collectionRef.current.scrollToTop();
    },
  };
}

export function createSyncProps<T>(
  options: UseCollectionOptions<T>,
  {
    filteringText,
    sortingState,
    selectedItems,
    expandedGroups,
    currentPageIndex,
    propertyFilteringQuery,
  }: CollectionState<T>,
  actions: InternalCollectionActions<T>,
  collectionRef: React.RefObject<CollectionRef>,
  {
    pagesCount,
    actualPageIndex,
    allItems,
    allPageItems,
  }: { pagesCount?: number; actualPageIndex?: number; allItems: ReadonlyArray<T>; allPageItems: ReadonlyArray<T> }
): Pick<UseCollectionResult<T>, 'collectionProps' | 'filterProps' | 'paginationProps' | 'propertyFilterProps'> {
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
    ? options.propertyFiltering.filteringProperties.reduce<PropertyFilterOption[]>((acc, property) => {
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
      ...(options.expandableGroups
        ? {
            getItemGroupProps: item => {
              const groupKey = options.expandableGroups!.getGroupKey(item);
              const parentGroup = options.expandableGroups!.getParentGroup(item);
              const expandable = options.expandableGroups!.isGroupExpandable(item);
              const expanded = expandedGroups.has(groupKey);
              return { parentGroup, groupKey, expandable, expanded };
            },
            onItemGroupChange: ({ detail: { item, expanded } }) => {
              const itemKey = options.expandableGroups!.getGroupKey(item);
              const newExpandedGroups = new Set(expandedGroups);
              if (!expanded) {
                newExpandedGroups.delete(itemKey);
              } else {
                newExpandedGroups.add(itemKey);
              }
              actions.setExpandedGroups(newExpandedGroups);
            },
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
      ...(options.pagination?.pageSize
        ? {
            totalItemsCount: allPageItems.length,
            firstIndex: ((actualPageIndex ?? currentPageIndex) - 1) * options.pagination.pageSize + 1,
          }
        : {}),
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
