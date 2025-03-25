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
  if (pageIndex < 1 || (pageIndex > pagesCount && !pagination.allowPageOutOfRange) || Number.isNaN(pageIndex)) {
    pageIndex = 1;
  }
  return { pageSize, pagesCount, pageIndex };
}
