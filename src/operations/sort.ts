// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { SortingState } from '../interfaces';

function getSorter<T>(sortingField: keyof T) {
  return (row1: T, row2: T) => {
    // Use empty string as a default value, because it works well to compare with both strings and numbers:
    // Every number can be casted to a string, but not every string can be casted to a meaningful number,
    // sometimes it is NaN.
    const value1 = row1[sortingField] ?? '';
    const value2 = row2[sortingField] ?? '';
    if (typeof value1 === 'string' && typeof value2 === 'string') {
      return value1.localeCompare(value2);
    }
    // use loose comparison to handle inconsistent data types
    // eslint-disable-next-line eqeqeq
    return value1 < value2 ? -1 : value1 == value2 ? 0 : 1;
  };
}

export function sort<T>(items: ReadonlyArray<T>, state: SortingState<T> | undefined): ReadonlyArray<T> {
  if (!state) {
    return items;
  }
  const { sortingColumn } = state;

  const comparator =
    'sortingComparator' in sortingColumn
      ? sortingColumn.sortingComparator
      : sortingColumn.sortingField
      ? getSorter(sortingColumn.sortingField as keyof T)
      : undefined;
  if (!comparator) {
    return items;
  }
  const sorted = items.slice();
  const direction = state.isDescending ? -1 : 1;
  sorted.sort((a, b) => comparator(a, b) * direction);

  return sorted;
}
