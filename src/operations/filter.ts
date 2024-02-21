// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FilteringOptions, UseCollectionOptions } from '../interfaces';
import { Predicate } from './compose-filters';

function defaultFilteringFunction<T>(item: T, filteringText: string, filteringFields?: string[]) {
  if (filteringText.length === 0) {
    return true;
  }
  filteringFields = filteringFields || Object.keys(item as Record<string, any>);
  const lowFilteringText = filteringText.toLowerCase();

  return filteringFields.some(
    key =>
      String((item as Record<string, any>)[key])
        .toLowerCase()
        .indexOf(lowFilteringText) > -1
  );
}

export function createFilterPredicate<T>(
  filtering: UseCollectionOptions<T>['filtering'],
  filteringText = ''
): null | Predicate<T> {
  if (!filtering) {
    return null;
  }
  const filteringFunction = filtering.filteringFunction ?? defaultFilteringFunction;
  return item => filteringFunction(item, filteringText, filtering.fields);
}

// Keeping this function as there are customers depending on it.
export function filter<T>(
  items: ReadonlyArray<T>,
  filteringText = '',
  filteringOptions: FilteringOptions<T>
): ReadonlyArray<T> {
  const predicate = createFilterPredicate(filteringOptions, filteringText);
  return predicate ? items.filter(predicate) : items;
}
