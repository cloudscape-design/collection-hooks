// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { UseCollectionOptions } from '../interfaces';

const DEFAULT_PAGE_SIZE = 10;

export function paginate<T>(
  pagination: UseCollectionOptions<T>['pagination'],
  currentPageIndex: undefined | number,
  items: ReadonlyArray<T>
): {
  items: ReadonlyArray<T>;
  allPageItems: ReadonlyArray<T>;
  pagesCount: undefined | number;
  actualPageIndex: undefined | number;
} {
  const allPageItems = items;
  let pagesCount: undefined | number = undefined;
  let actualPageIndex: undefined | number = undefined;
  if (pagination) {
    const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
    pagesCount = getPagesCount(items, pageSize);
    actualPageIndex = normalizePageIndex(currentPageIndex, pagesCount);
    items = items.slice((actualPageIndex - 1) * pageSize, actualPageIndex * pageSize);
  }
  return { items, allPageItems, pagesCount, actualPageIndex };
}

function normalizePageIndex(currentIndex: number | undefined, pagesCount: number): number {
  if (!currentIndex || currentIndex < 1 || currentIndex > pagesCount) {
    return 1;
  }
  return currentIndex;
}

function getPagesCount<T>(items: ReadonlyArray<T>, pageSize: number): number {
  return Math.ceil(items.length / pageSize);
}
