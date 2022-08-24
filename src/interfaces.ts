// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as React from 'react';

// shim for dom types
interface CustomEvent<T> {
  detail: T;
}

export interface FilteringOptions<T> {
  filteringFunction?: (item: T, filteringText: string, filteringFields?: string[]) => boolean;
  fields?: string[];
}

export interface SortingState<T> {
  isDescending?: boolean;
  sortingColumn: SortingColumn<T>;
}

export interface SortingColumn<T> {
  sortingField?: string;
  sortingComparator?: (a: T, b: T) => number;
}

export interface SelectionChangeDetail<T> {
  selectedItems: ReadonlyArray<T>;
}

export type TrackBy<T> = string | ((item: T) => string);

export interface UseCollectionOptions<T> {
  filtering?: FilteringOptions<T> & {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    defaultFilteringText?: string;
  };
  propertyFiltering?: {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    filteringProperties: readonly PropertyFilterProperty[];
    // custom filtering function
    filteringFunction?: (item: T, query: PropertyFilterQuery) => boolean;
    defaultQuery?: PropertyFilterQuery;
  };
  sorting?: { defaultState?: SortingState<T> };
  pagination?: { defaultPage?: number; pageSize?: number };
  selection?: {
    defaultSelectedItems?: ReadonlyArray<T>;
    keepSelection?: boolean;
    trackBy?: TrackBy<T>;
  };
}

export interface CollectionState<T> {
  filteringText: string;
  propertyFilteringQuery: PropertyFilterQuery;
  currentPageIndex: number;
  sortingState?: SortingState<T>;
  selectedItems: ReadonlyArray<T>;
}

export interface CollectionActions<T> {
  setFiltering(filteringText: string): void;
  setCurrentPage(pageNumber: number): void;
  setSorting(state: SortingState<T>): void;
  setSelectedItems(selectedItems: ReadonlyArray<T>): void;
  setPropertyFiltering(query: PropertyFilterQuery): void;
}

interface UseCollectionResultBase<T> {
  items: ReadonlyArray<T>;
  actions: CollectionActions<T>;
  collectionProps: {
    empty?: React.ReactNode;
    onSortingChange?(event: CustomEvent<SortingState<T>>): void;
    sortingColumn?: SortingColumn<T>;
    sortingDescending?: boolean;
    selectedItems?: ReadonlyArray<T>;
    onSelectionChange?(event: CustomEvent<SelectionChangeDetail<T>>): void;
    trackBy?: string | ((item: T) => string);
    ref: React.RefObject<CollectionRef>;
  };
  filterProps: {
    disabled?: boolean;
    filteringText: string;
    onChange(event: CustomEvent<{ filteringText: string }>): void;
  };
  propertyFilterProps: {
    query: PropertyFilterQuery;
    onChange(event: CustomEvent<PropertyFilterQuery>): void;
    filteringProperties: readonly (PropertyFilterProperty & {
      operators?: readonly (PropertyFilterOperator | PropertyFilterOperatorExtended)[];
    })[];
    filteringOptions: readonly PropertyFilterOption[];
  };
  paginationProps: {
    disabled?: boolean;
    currentPageIndex: number;
    onChange(event: CustomEvent<{ currentPageIndex: number }>): void;
  };
}

export interface UseCollectionResult<T> extends UseCollectionResultBase<T> {
  filteredItemsCount: number | undefined;
  paginationProps: UseCollectionResultBase<T>['paginationProps'] & {
    pagesCount: number;
  };
}

export interface CollectionRef {
  scrollToTop: () => void;
}

export type PropertyFilterOperator = '<' | '<=' | '>' | '>=' | ':' | '!:' | '=' | '!=';

export interface PropertyFilterOperatorExtended {
  value: PropertyFilterOperator;
  match?: PropertyFilterOperatorMatch;
  [other: string]: unknown;
}

export type PropertyFilterOperatorMatch = PropertyFilterOperatorMatchByType | PropertyFilterOperatorMatchCustom;

export type PropertyFilterOperatorMatchByType = 'date' | 'datetime';

export type PropertyFilterOperatorMatchCustom = (itemValue: any, tokenValue: any) => boolean;

export type PropertyFilterOperation = 'and' | 'or';
export interface PropertyFilterToken {
  // By default, the token value is a string.
  // When a custom property is used, the token value can be any;
  value: any;
  propertyKey?: string;
  operator: PropertyFilterOperator;
}
export interface PropertyFilterQuery {
  tokens: readonly PropertyFilterToken[];
  operation: PropertyFilterOperation;
}
export interface PropertyFilterProperty {
  key: string;
  groupValuesLabel: string;
  propertyLabel: string;
  operators?: readonly (PropertyFilterOperator | PropertyFilterOperatorExtended)[];
  defaultOperator?: PropertyFilterOperator;
  group?: string;
}
export interface PropertyFilterOption {
  propertyKey: string;
  value: string;
}
