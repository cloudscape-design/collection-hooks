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

export type Operator = '<' | '<=' | '>' | '>=' | ':' | '!:' | '=' | '!=' | 'IN';
export type Operation = 'and' | 'or';
export interface Token {
  value: any;
  propertyKey?: string;
  operator: Operator;
}
export interface Query {
  tokens: readonly Token[];
  operation: Operation;
}
export interface FilteringProperty<T, Key extends keyof T = any> {
  key: Key;
  groupValuesLabel: string;
  propertyLabel: string;
  operators?: readonly Operator[];
  defaultOperator?: Operator;
  group?: string;
  // custom filtering function
  filteringFunction?: (value: T[Key], tokenValue: any, tokenOperator: Operator) => boolean;
  // Alternative API (performance)
  // filteringFunction?: (tokenValue: string, tokenOperator: Operator) => (value: T[Key]) => boolean
}
export interface PropertyFilteringOption {
  propertyKey: string;
  value: string;
}

export interface UseCollectionOptions<T> {
  filtering?: FilteringOptions<T> & {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    defaultFilteringText?: string;
  };
  propertyFiltering?: {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    filteringProperties: readonly FilteringProperty<T>[];
    // custom filtering function
    filteringFunction?: (item: T, query: Query) => boolean;
    defaultQuery?: Query;
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
  propertyFilteringQuery: Query;
  currentPageIndex: number;
  sortingState?: SortingState<T>;
  selectedItems: ReadonlyArray<T>;
}

export interface CollectionActions<T> {
  setFiltering(filteringText: string): void;
  setCurrentPage(pageNumber: number): void;
  setSorting(state: SortingState<T>): void;
  setSelectedItems(selectedItems: ReadonlyArray<T>): void;
  setPropertyFiltering(query: Query): void;
}

interface UseCollectionResultBase<T> {
  items: ReadonlyArray<T>;
  actions: CollectionActions<T>;
  collectionProps: {
    empty?: React.ReactNode;
    loading?: boolean;
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
    query: Query;
    onChange(event: CustomEvent<Query>): void;
    filteringProperties: readonly FilteringProperty<T>[];
    filteringOptions: readonly PropertyFilteringOption[];
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

// Corresponds to DateRangePickerProps.TimeUnit.
export type DateTimeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month' | 'year';

export interface DateRange {
  start: Date;
  end: Date;
}
