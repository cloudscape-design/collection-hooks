// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type Predicate<T> = (item: T) => boolean;

export function composeFilters<T>(...predicates: Array<null | Predicate<T>>): null | Predicate<T> {
  return predicates.some(Boolean)
    ? item => {
        for (const predicate of predicates) {
          if (predicate && !predicate(item)) {
            return false;
          }
        }
        return true;
      }
    : null;
}
