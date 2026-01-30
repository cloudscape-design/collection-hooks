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

export interface GroupSelectionState<T> {
  inverted: boolean;
  toggledItems: readonly T[];
}

export interface GroupSelectionChangeDetail<T> {
  groupSelection: GroupSelectionState<T>;
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
    freeTextFiltering?: PropertyFilterFreeTextFiltering;
  };
  sorting?: { defaultState?: SortingState<T> };
  pagination?: { defaultPage?: number; pageSize?: number; allowPageOutOfRange?: boolean };
  selection?: {
    defaultSelectedItems?: ReadonlyArray<T>;
    keepSelection?: boolean;
    trackBy?: TrackBy<T>;
  };
  expandableRows?: ExpandableRowsProps<T>;
}

export interface ExpandableRowsProps<ItemType> {
  getId(item: ItemType): string;
  getParentId(item: ItemType): null | string;
  defaultExpandedItems?: ReadonlyArray<ItemType>;
  // When set, only leaf nodes (those with no children) are reflected in the counters,
  // and selection is replaced by group selection.
  dataGrouping?: DataGroupingProps;
}

// There is no configuration for data grouping yet, but it might come in future releases.
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface DataGroupingProps {}

export interface CollectionState<T> {
  filteringText: string;
  propertyFilteringQuery: PropertyFilterQuery;
  currentPageIndex: number;
  sortingState?: SortingState<T>;
  selectedItems: ReadonlyArray<T>;
  expandedItems: ReadonlyArray<T>;
  groupSelection: GroupSelectionState<T>;
}

export interface CollectionActions<T> {
  setFiltering(filteringText: string): void;
  setCurrentPage(pageNumber: number): void;
  setSorting(state: SortingState<T>): void;
  setSelectedItems(selectedItems: ReadonlyArray<T>): void;
  setPropertyFiltering(query: PropertyFilterQuery): void;
  setExpandedItems(items: ReadonlyArray<T>): void;
  setGroupSelection(state: GroupSelectionState<T>): void;
}

interface UseCollectionResultBase<T> {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  actions: CollectionActions<T>;
  collectionProps: {
    empty?: React.ReactNode;
    onSortingChange?(event: CustomEventLike<SortingState<T>>): void;
    sortingColumn?: SortingColumn<T>;
    sortingDescending?: boolean;
    // When data grouping is set, the property is derived from group selection, and includes all effectively selected items.
    selectedItems?: ReadonlyArray<T>;
    onSelectionChange?(event: CustomEventLike<SelectionChangeDetail<T>>): void;
    expandableRows?: ExpandableRowsResult<T>;
    trackBy?: string | ((item: T) => string);
    ref: React.RefObject<CollectionRef>;
    // The count of all root items (on all pages). It is used together with the firstIndex to announce page changes.
    totalItemsCount: number;
    firstIndex: number;
  };
  filterProps: {
    disabled?: boolean;
    filteringText: string;
    onChange(event: CustomEventLike<{ filteringText: string }>): void;
  };
  propertyFilterProps: {
    query: PropertyFilterQuery;
    onChange(event: CustomEventLike<PropertyFilterQuery>): void;
    filteringProperties: readonly PropertyFilterProperty[];
    filteringOptions: readonly PropertyFilterOption[];
    freeTextFiltering?: PropertyFilterFreeTextFiltering;
  };
  paginationProps: {
    disabled?: boolean;
    currentPageIndex: number;
    onChange(event: CustomEventLike<{ currentPageIndex: number }>): void;
  };
}

export interface ExpandableRowsResultBase<T> {
  getItemChildren: (item: T) => T[];
  isItemExpandable: (item: T) => boolean;
  // The counters reflect the number of nested selectable/selected nodes (deeply), including the given one.
  // When data grouping is set, only leaf nodes are counted. The getters return 1 when called on leaf nodes.
  getItemsCount?: (item: T) => number;
  totalItemsCount: number;
  getSelectedItemsCount?: (item: T) => number;
  totalSelectedItemsCount: number;
}

export interface ExpandableRowsResult<T> extends ExpandableRowsResultBase<T> {
  expandedItems: ReadonlyArray<T>;
  onExpandableItemToggle(event: CustomEventLike<{ item: T; expanded: boolean }>): void;
  // The groupSelection property is only added in case selection is configured, and data grouping is set.
  groupSelection?: GroupSelectionState<T>;
  onGroupSelectionChange(event: CustomEventLike<GroupSelectionChangeDetail<T>>): void;
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

export type PropertyFilterOperator = '<' | '<=' | '>' | '>=' | ':' | '!:' | '=' | '!=' | '^' | string;

export interface PropertyFilterOperatorExtended<TokenValue> {
  operator: PropertyFilterOperator;
  tokenType?: PropertyFilterTokenType;
  match?: PropertyFilterOperatorMatch<TokenValue>;
  form?: PropertyFilterOperatorForm<TokenValue>;
  format?: PropertyFilterOperatorFormat<TokenValue>;
}

export type PropertyFilterTokenType = 'value' | 'enum';

export type PropertyFilterOperatorMatch<TokenValue> =
  | PropertyFilterOperatorMatchByType
  | PropertyFilterOperatorMatchCustom<TokenValue>;

export type PropertyFilterOperatorMatchByType = 'date' | 'datetime';

export type PropertyFilterOperatorMatchCustom<TokenValue> = (itemValue: unknown, tokenValue: TokenValue) => boolean;

export interface PropertyFilterOperatorFormProps<TokenValue> {
  value: null | TokenValue;
  onChange: (value: null | TokenValue) => void;
  filter?: string;
  operator: PropertyFilterOperator;
}

export type PropertyFilterOperatorForm<TokenValue> = React.FC<PropertyFilterOperatorFormProps<TokenValue>>;

export type PropertyFilterOperatorFormat<TokenValue> = (value: TokenValue) => string;

export type PropertyFilterOperation = 'and' | 'or';
export interface PropertyFilterToken {
  // By default, the token value is a string.
  // When a custom property is used, the token value can be any;
  value: any;
  propertyKey?: string;
  operator: PropertyFilterOperator;
}
export interface PropertyFilterTokenGroup {
  operation: PropertyFilterOperation;
  tokens: readonly (PropertyFilterToken | PropertyFilterTokenGroup)[];
}
export interface PropertyFilterQuery {
  tokens: readonly PropertyFilterToken[];
  operation: PropertyFilterOperation;
  tokenGroups?: readonly (PropertyFilterToken | PropertyFilterTokenGroup)[];
}
export interface PropertyFilterProperty<TokenValue = any> {
  key: string;
  groupValuesLabel: string;
  propertyLabel: string;
  operators?: readonly (PropertyFilterOperator | PropertyFilterOperatorExtended<TokenValue>)[];
  defaultOperator?: PropertyFilterOperator;
  group?: string;
}

export interface PropertyFilterOption {
  propertyKey: string;
  value: string;
  label?: string;
  tags?: ReadonlyArray<string>;
  filteringTags?: ReadonlyArray<string>;
}
export interface PropertyFilterFreeTextFiltering {
  operators?: readonly PropertyFilterOperator[];
  defaultOperator?: PropertyFilterOperator;
}
