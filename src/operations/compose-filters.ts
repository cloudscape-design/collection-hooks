// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type Predicate<T> = (item: T) => boolean;

export function composeFilters<T>(...predicates: Array<null | Predicate<T>>): null | Predicate<T> {
  let composed: null | Predicate<T> = null;
  for (const predicate of predicates) {
    if (predicate) {
      const previous: Predicate<T> = composed ?? (() => true);
      composed = (item: T) => previous(item) && predicate(item);
    }
  }
  return composed;
}
