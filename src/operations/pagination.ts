// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { UseCollectionOptions } from '../interfaces';

const DEFAULT_PAGE_SIZE = 10;

export function createPageProps<T>(
  pagination: UseCollectionOptions<T>['pagination'],
  currentPageIndex: undefined | number,
  items: ReadonlyArray<T>
): null | { pageSize: number; pagesCount: number; pageIndex: number } {
  if (!pagination) {
    return null;
  }
  const pageSize = pagination.pageSize ?? DEFAULT_PAGE_SIZE;
  const pagesCount = Math.ceil(items.length / pageSize);
  let pageIndex = currentPageIndex ?? 1;
  if (pageIndex < 1 || pageIndex > pagesCount || Number.isNaN(pageIndex)) {
    pageIndex = 1;
  }
  return { pageSize, pagesCount, pageIndex };
}

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
