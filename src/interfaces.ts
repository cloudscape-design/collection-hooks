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

export type Operator = '<' | '<=' | '>' | '>=' | ':' | '!:' | '=' | '!=' | 'in';
export type Operation = 'and' | 'or';
export interface Token<Op extends Operator> {
  value: string;
  propertyKey?: string;
  operator: Op;
}
export interface Query<Op extends Operator> {
  tokens: readonly Token<Op>[];
  operation: Operation;
}
export interface FilteringProperty<Op extends Operator> {
  key: string;
  groupValuesLabel: string;
  propertyLabel: string;
  operators?: readonly Op[];
  defaultOperator?: Op;
  group?: string;
}
export interface PropertyFilteringOption {
  propertyKey: string;
  value: string;
}

export interface UseCollectionOptions<T, Op extends Operator> {
  filtering?: FilteringOptions<T> & {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    defaultFilteringText?: string;
  };
  propertyFiltering?: {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    filteringProperties: readonly FilteringProperty<Op>[];
    // custom filtering function
    filteringFunction?: (item: T, query: Query<Op>) => boolean;
    defaultQuery?: Query<Op>;
  };
  sorting?: { defaultState?: SortingState<T> };
  pagination?: { defaultPage?: number; pageSize?: number };
  selection?: {
    defaultSelectedItems?: ReadonlyArray<T>;
    keepSelection?: boolean;
    trackBy?: TrackBy<T>;
  };
}

export interface CollectionState<T, Op extends Operator> {
  filteringText: string;
  propertyFilteringQuery: Query<Op>;
  currentPageIndex: number;
  sortingState?: SortingState<T>;
  selectedItems: ReadonlyArray<T>;
}

export interface CollectionActions<T, Op extends Operator> {
  setFiltering(filteringText: string): void;
  setCurrentPage(pageNumber: number): void;
  setSorting(state: SortingState<T>): void;
  setSelectedItems(selectedItems: ReadonlyArray<T>): void;
  setPropertyFiltering(query: Query<Op>): void;
}

interface UseCollectionResultBase<T, Op extends Operator> {
  items: ReadonlyArray<T>;
  actions: CollectionActions<T, Op>;
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
    query: Query<Op>;
    onChange(event: CustomEvent<Query<Op>>): void;
    filteringProperties: readonly FilteringProperty<Op>[];
    filteringOptions: readonly PropertyFilteringOption[];
  };
  paginationProps: {
    disabled?: boolean;
    currentPageIndex: number;
    onChange(event: CustomEvent<{ currentPageIndex: number }>): void;
  };
}

export interface UseCollectionResult<T, Op extends Operator = Operator> extends UseCollectionResultBase<T, Op> {
  filteredItemsCount: number | undefined;
  paginationProps: UseCollectionResultBase<T, Op>['paginationProps'] & {
    pagesCount: number;
  };
}

export interface CollectionRef {
  scrollToTop: () => void;
}
