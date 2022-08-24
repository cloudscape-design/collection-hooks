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

export interface UseCollectionOptions<T, P extends PropertyFilterProperty = PropertyFilterProperty> {
  filtering?: FilteringOptions<T> & {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    defaultFilteringText?: string;
  };
  propertyFiltering?: {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    filteringProperties: readonly P[];
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

interface UseCollectionResultBase<T, P extends PropertyFilterProperty> {
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
    filteringProperties: readonly P[];
    filteringOptions: readonly PropertyFilterOption[];
  };
  paginationProps: {
    disabled?: boolean;
    currentPageIndex: number;
    onChange(event: CustomEvent<{ currentPageIndex: number }>): void;
  };
}

export interface UseCollectionResult<T, P extends PropertyFilterProperty = PropertyFilterProperty>
  extends UseCollectionResultBase<T, P> {
  filteredItemsCount: number | undefined;
  paginationProps: UseCollectionResultBase<T, P>['paginationProps'] & {
    pagesCount: number;
  };
}

export interface CollectionRef {
  scrollToTop: () => void;
}

export type PropertyFilterOperator = '<' | '<=' | '>' | '>=' | ':' | '!:' | '=' | '!=';

export type PropertyFilterOperation = 'and' | 'or';
export interface PropertyFilterToken {
  value: string;
  propertyKey?: string;
  operator: PropertyFilterOperator;
}
export interface PropertyFilterQuery {
  tokens: readonly PropertyFilterToken[];
  operation: PropertyFilterOperation;
}
export interface PropertyFilterProperty {
  key: string;
  operators?: readonly PropertyFilterOperator[];
  defaultOperator?: PropertyFilterOperator;
}
export interface PropertyFilterOption {
  propertyKey: string;
  value: string;
}
