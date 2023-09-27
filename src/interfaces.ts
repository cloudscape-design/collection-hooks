// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as React from 'react';

// shim for dom types
interface CustomEventLike<T> {
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

export interface UseCollectionOptions<T, OperatorType extends string = PropertyFilterOperator> {
  filtering?: FilteringOptions<T> & {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    defaultFilteringText?: string;
  };
  propertyFiltering?: {
    empty?: React.ReactNode;
    noMatch?: React.ReactNode;
    filteringProperties: readonly PropertyFilterProperty<any, OperatorType>[];
    // custom filtering function
    filteringFunction?: (item: T, query: PropertyFilterQuery<OperatorType>) => boolean;
    defaultQuery?: PropertyFilterQuery<OperatorType>;
  };
  sorting?: { defaultState?: SortingState<T> };
  pagination?: { defaultPage?: number; pageSize?: number };
  selection?: {
    defaultSelectedItems?: ReadonlyArray<T>;
    keepSelection?: boolean;
    trackBy?: TrackBy<T>;
  };
}

export interface CollectionState<T, OperatorType extends string = PropertyFilterOperator> {
  filteringText: string;
  propertyFilteringQuery: PropertyFilterQuery<OperatorType>;
  currentPageIndex: number;
  sortingState?: SortingState<T>;
  selectedItems: ReadonlyArray<T>;
}

export interface CollectionActions<T, OperatorType extends string = PropertyFilterOperator> {
  setFiltering(filteringText: string): void;
  setCurrentPage(pageNumber: number): void;
  setSorting(state: SortingState<T>): void;
  setSelectedItems(selectedItems: ReadonlyArray<T>): void;
  setPropertyFiltering(query: PropertyFilterQuery<OperatorType>): void;
}

interface UseCollectionResultBase<T, OperatorType extends string = PropertyFilterOperator> {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  actions: CollectionActions<T, OperatorType>;
  collectionProps: {
    empty?: React.ReactNode;
    onSortingChange?(event: CustomEventLike<SortingState<T>>): void;
    sortingColumn?: SortingColumn<T>;
    sortingDescending?: boolean;
    selectedItems?: ReadonlyArray<T>;
    onSelectionChange?(event: CustomEventLike<SelectionChangeDetail<T>>): void;
    trackBy?: string | ((item: T) => string);
    ref: React.RefObject<CollectionRef>;
    totalItemsCount?: number;
    firstIndex?: number;
  };
  filterProps: {
    disabled?: boolean;
    filteringText: string;
    onChange(event: CustomEventLike<{ filteringText: string }>): void;
  };
  propertyFilterProps: {
    query: PropertyFilterQuery;
    onChange(event: CustomEventLike<PropertyFilterQuery<OperatorType>>): void;
    filteringProperties: readonly PropertyFilterProperty<any, OperatorType>[];
    filteringOptions: readonly PropertyFilterOption[];
  };
  paginationProps: {
    disabled?: boolean;
    currentPageIndex: number;
    onChange(event: CustomEventLike<{ currentPageIndex: number }>): void;
  };
}

export interface UseCollectionResult<T, OperatorType extends string = PropertyFilterOperator>
  extends UseCollectionResultBase<T, OperatorType> {
  filteredItemsCount: number | undefined;
  paginationProps: UseCollectionResultBase<T, OperatorType>['paginationProps'] & {
    pagesCount: number;
  };
}

export interface CollectionRef {
  scrollToTop: () => void;
}

export type PropertyFilterOperator = '<' | '<=' | '>' | '>=' | ':' | '!:' | '=' | '!=';

export interface PropertyFilterOperatorExtended<TokenValue, OperatorType extends string = PropertyFilterOperator> {
  operator: OperatorType;
  match?: PropertyFilterOperatorMatch<TokenValue>;
  form?: PropertyFilterOperatorForm<TokenValue>;
  format?: PropertyFilterOperatorFormat<TokenValue>;
}

export type PropertyFilterOperatorMatch<TokenValue> =
  | PropertyFilterOperatorMatchByType
  | PropertyFilterOperatorMatchCustom<TokenValue>;

export type PropertyFilterOperatorMatchByType = 'date' | 'datetime';

export type PropertyFilterOperatorMatchCustom<TokenValue> = (itemValue: unknown, tokenValue: TokenValue) => boolean;

export interface PropertyFilterOperatorFormProps<TokenValue, OperatorType extends string = PropertyFilterOperator> {
  value: null | TokenValue;
  onChange: (value: null | TokenValue) => void;
  filter?: string;
  operator: OperatorType;
}

export type PropertyFilterOperatorForm<TokenValue> = React.FC<PropertyFilterOperatorFormProps<TokenValue>>;

export type PropertyFilterOperatorFormat<TokenValue> = (value: TokenValue) => string;

export type PropertyFilterOperation = 'and' | 'or';
export interface PropertyFilterToken<OperatorType extends string = PropertyFilterOperator> {
  // By default, the token value is a string.
  // When a custom property is used, the token value can be any;
  value: any;
  propertyKey?: string;
  operator: OperatorType;
}
export interface PropertyFilterQuery<OperatorType extends string = PropertyFilterOperator> {
  tokens: readonly PropertyFilterToken<OperatorType>[];
  operation: PropertyFilterOperation;
}
export interface PropertyFilterProperty<TokenValue = any, OperatorType extends string = PropertyFilterOperator> {
  key: string;
  groupValuesLabel: string;
  propertyLabel: string;
  operators?: readonly (OperatorType | PropertyFilterOperatorExtended<TokenValue, OperatorType>)[];
  defaultOperator?: OperatorType;
  group?: string;
}
export interface PropertyFilterOption {
  propertyKey: string;
  value: string;
  label?: string;
}
