// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { processItems } from '../../operations';

test('filtering with pagination', () => {
  const items = [
    { id: 1, value: 'match' },
    { id: 2, value: 'match' },
    { id: 3, value: '' },
    { id: 4, value: '' },
    { id: 5, value: 'match' },
    { id: 6, value: 'match' },
    { id: 7, value: 'match' },
    { id: 8, value: '' },
    { id: 9, value: 'match' },
    { id: 10, value: 'match' },
  ];
  const {
    items: processed,
    pagesCount,
    filteredItemsCount,
  } = processItems(
    items,
    { filteringText: 'match', currentPageIndex: 2 },
    { filtering: {}, pagination: { pageSize: 5 } }
  );
  expect(pagesCount).toEqual(2);
  expect(filteredItemsCount).toEqual(7);
  expect(processed).toEqual([items[8], items[9]]);
});

test('filtering with sorting', () => {
  const items = [
    { id: 5, value: 'match' },
    { id: 3, value: '' },
    { id: 1, value: 'match' },
    { id: 2, value: 'match' },
    { id: 4, value: '' },
  ];
  const {
    items: processed,
    pagesCount,
    filteredItemsCount,
  } = processItems(
    items,
    { filteringText: 'match', sortingState: { sortingColumn: { sortingField: 'id' } } },
    { sorting: {}, filtering: {} }
  );
  expect(pagesCount).toBeUndefined();
  expect(filteredItemsCount).toEqual(3);
  expect(processed).toEqual([items[2], items[3], items[0]]);
});

test('pagination with sorting', () => {
  const items = [{ id: 1 }, { id: 4 }, { id: 7 }, { id: 2 }, { id: 3 }, { id: 5 }, { id: 6 }];
  const {
    items: processed,
    pagesCount,
    filteredItemsCount,
  } = processItems(
    items,
    { currentPageIndex: 2, sortingState: { sortingColumn: { sortingField: 'id' } } },
    { sorting: {}, pagination: { pageSize: 5 } }
  );
  expect(pagesCount).toEqual(2);
  expect(filteredItemsCount).toBeUndefined();
  expect(processed).toEqual([items[6], items[2]]);
});

test('all together', () => {
  const items = [
    { id: 6, value: 'match' },
    { id: 10, value: 'match' },
    { id: 2, value: 'match' },
    { id: 7, value: 'match' },
    { id: 9, value: 'match' },
    { id: 1, value: 'match' },
    { id: 3, value: 'match' },
    { id: 4, value: '' },
    { id: 5, value: 'match' },
    { id: 8, value: '' },
  ];
  const {
    items: processed,
    pagesCount,
    filteredItemsCount,
  } = processItems(
    items,
    { filteringText: 'match', currentPageIndex: 2, sortingState: { sortingColumn: { sortingField: 'id' } } },
    { filtering: {}, sorting: {}, pagination: { pageSize: 5 } }
  );
  expect(pagesCount).toEqual(2);
  expect(filteredItemsCount).toEqual(8);
  expect(processed).toEqual([items[3], items[4], items[1]]);
});
