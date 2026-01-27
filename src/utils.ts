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
  CollectionActions,
  GroupSelectionState,
} from './interfaces';
import { fixupFalsyValues } from './operations/property-filter.js';

interface SelectionAction<T> {
  type: 'selection';
  selectedItems: ReadonlyArray<T>;
}
interface GroupSelectionAction<T> {
  type: 'group-selection';
  state: GroupSelectionState<T>;
}
interface ExpansionAction<T> {
  type: 'expansion';
  expandedItems: ReadonlyArray<T>;
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
  | GroupSelectionAction<T>
  | ExpansionAction<T>
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
    case 'group-selection':
      newState.groupSelection = action.state;
      break;
    case 'expansion':
      newState.expandedItems = action.expandedItems;
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
}): CollectionActions<T> {
  return {
    setFiltering(filteringText) {
      dispatch({ type: 'filtering', filteringText });
      collectionRef.current?.scrollToTop();
    },
    setSorting(state: SortingState<T>) {
      dispatch({ type: 'sorting', sortingState: state });
      collectionRef.current?.scrollToTop();
    },
    setCurrentPage(pageIndex: number) {
      dispatch({ type: 'pagination', pageIndex });
      collectionRef.current?.scrollToTop();
    },
    setSelectedItems(selectedItems: Array<T>) {
      dispatch({ type: 'selection', selectedItems });
    },
    setPropertyFiltering(query: PropertyFilterQuery) {
      dispatch({ type: 'property-filtering', query });
      collectionRef.current?.scrollToTop();
    },
    setExpandedItems(expandedItems: ReadonlyArray<T>) {
      dispatch({ type: 'expansion', expandedItems });
    },
    setGroupSelection(groupSelection: GroupSelectionState<T>) {
      dispatch({ type: 'group-selection', state: groupSelection });
    },
  };
}

export function createSyncProps<T>(
  options: UseCollectionOptions<T>,
  {
    filteringText,
    sortingState,
    selectedItems,
    expandedItems,
    currentPageIndex,
    propertyFilteringQuery,
    groupSelection,
  }: CollectionState<T>,
  actions: CollectionActions<T>,
  collectionRef: React.RefObject<CollectionRef>,
  {
    pagesCount,
    actualPageIndex,
    allItems,
    totalItemsCount,
    getItemsCount,
    getSelectedItemsCount,
    getChildren,
  }: {
    pagesCount?: number;
    actualPageIndex?: number;
    allItems: readonly T[];
    totalItemsCount: number;
    getItemsCount?: (item: T) => number;
    getSelectedItemsCount?: (item: T) => number;
    getChildren: (item: T) => T[];
  }
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
      ...(options.expandableRows
        ? {
            expandableRows: {
              getItemChildren(item: T) {
                return getChildren(item);
              },
              isItemExpandable(item: T) {
                return getChildren(item).length > 0;
              },
              expandedItems,
              onExpandableItemToggle: ({ detail: { item, expanded } }) => {
                const getId = options.expandableRows!.getId;
                if (expanded) {
                  for (const stateItem of expandedItems) {
                    if (getId(stateItem) === getId(item)) {
                      return;
                    }
                  }
                  actions.setExpandedItems([...expandedItems, item]);
                } else {
                  actions.setExpandedItems(expandedItems.filter(stateItem => getId(stateItem) !== getId(item)));
                }
              },
              // The table component uses group selection when expandableRows.groupSelection is defined. Therefore,
              // we only pass this property when selection and dataGrouping are configured in use-collection options.
              groupSelection: options.selection && options.expandableRows.dataGrouping ? groupSelection : undefined,
              onGroupSelectionChange: ({ detail }) => actions.setGroupSelection(detail.groupSelection),
              getItemsCount,
              getSelectedItemsCount,
            },
            // The trackBy property is used to match expanded items by ID and not by object reference.
            // The property can be overridden by the explicitly provided selection.trackBy.
            // If that is the case, we assume both selection.trackBy and expandableRows.getId have the same result.
            // If not, the expandable state won't be matched correctly by the table.
            trackBy: options.expandableRows.getId,
          }
        : {}),
      ...(options.selection
        ? {
            onSelectionChange: ({ detail: { selectedItems } }) => {
              actions.setSelectedItems(selectedItems);
            },
            selectedItems,
            trackBy: options.selection.trackBy ?? options.expandableRows?.getId,
          }
        : {}),
      ref: collectionRef,
      firstIndex: 1,
      totalItemsCount,
      totalSelectedItemsCount: selectedItems.length,
      ...(options.pagination?.pageSize
        ? {
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
      freeTextFiltering: options.propertyFiltering?.freeTextFiltering,
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
