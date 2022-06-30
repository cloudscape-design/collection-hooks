// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
const DEFAULT_PAGE_SIZE = 10;

export function paginate<T>(
  items: ReadonlyArray<T>,
  currentPage: number,
  pageSize = DEFAULT_PAGE_SIZE
): ReadonlyArray<T> {
  return items.slice((currentPage - 1) * pageSize, currentPage * pageSize);
}

export function normalizePageIndex(currentIndex: number | undefined, pagesCount: number): number {
  if (!currentIndex || currentIndex < 1 || currentIndex > pagesCount) {
    return 1;
  }
  return currentIndex;
}

export function getPagesCount<T>(items: ReadonlyArray<T>, pageSize = DEFAULT_PAGE_SIZE): number {
  return Math.ceil(items.length / pageSize);
}
