// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FilteringOptions } from '../interfaces';

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

export function filter<T>(
  items: ReadonlyArray<T>,
  filteringText = '',
  { filteringFunction = defaultFilteringFunction, fields }: FilteringOptions<T>
): ReadonlyArray<T> {
  return items.filter(item => filteringFunction(item, filteringText, fields));
}
