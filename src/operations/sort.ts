// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { SortingState, UseCollectionOptions } from '../interfaces';

function getSorter<T>(sortingField?: keyof T) {
  if (!sortingField) {
    return null;
  }
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

export function createComparator<T>(
  sorting: UseCollectionOptions<T>['sorting'],
  sortingColumns: ReadonlyArray<SortingState<T>> | undefined
): null | ((a: T, b: T) => number) {
  if (!sorting || !sortingColumns) {
    return null;
  }
  // Compose each column's comparator in priority order: the first entry wins, later entries break ties.
  const comparators = sortingColumns
    .map(entry => {
      const direction = entry.isDescending ? -1 : 1;
      const comparator =
        entry.sortingColumn.sortingComparator ?? getSorter(entry.sortingColumn.sortingField as keyof T);
      return comparator ? (a: T, b: T) => comparator(a, b) * direction : null;
    })
    .filter((comparator): comparator is (a: T, b: T) => number => comparator !== null);
  if (comparators.length === 0) {
    return null;
  }
  return (a, b) => {
    for (const comparator of comparators) {
      const result = comparator(a, b);
      if (result !== 0) {
        return result;
      }
    }
    return 0;
  };
}
