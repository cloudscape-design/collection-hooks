// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { FilteringOptions } from '../interfaces';

function defaultFilteringFunction<T extends Record<string, any>>(
  item: T,
  filteringText: string,
  filteringFields?: string[]
) {
  if (filteringText.length === 0) {
    return true;
  }
  filteringFields = filteringFields || Object.keys(item);
  const lowFilteringText = filteringText.toLowerCase();

  return filteringFields.some(key => String(item[key]).toLowerCase().indexOf(lowFilteringText) > -1);
}

export function filter<T>(
  items: ReadonlyArray<T>,
  filteringText = '',
  { filteringFunction = defaultFilteringFunction, fields }: FilteringOptions<T>
): ReadonlyArray<T> {
  return items.filter(item => filteringFunction(item, filteringText, fields));
}
