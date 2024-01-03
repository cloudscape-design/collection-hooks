// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { processItems } from '../../operations';

const generateItems = (length: number) => Array.from({ length }, (_, index) => index);

test('default pagination', () => {
  const items = generateItems(25);
  const { items: processed, pagesCount, actualPageIndex } = processItems(items, {}, { pagination: {} });
  expect(actualPageIndex).toEqual(1);
  expect(pagesCount).toEqual(3);
  expect(processed).toHaveLength(10);
  expect(processed[0]).toEqual(items[0]);
});

test('should reset the currentPageIndex to 1 when out of range', () => {
  const items = generateItems(25);

  // Page number is above the maximum
  let {
    items: processed,
    pagesCount,
    actualPageIndex,
  } = processItems(items, { currentPageIndex: 4 }, { pagination: {} });
  expect(actualPageIndex).toEqual(1);
  expect(pagesCount).toEqual(3);
  expect(processed).toHaveLength(10);
  expect(processed[0]).toEqual(items[0]);

  // Page number is below the minimum
  ({
    items: processed,
    pagesCount,
    actualPageIndex,
  } = processItems(items, { currentPageIndex: 0 }, { pagination: {} }));
  expect(actualPageIndex).toEqual(1);
  expect(pagesCount).toEqual(3);
  expect(processed).toHaveLength(10);
  expect(processed[0]).toEqual(items[0]);

  // Page number is NaN
  ({
    items: processed,
    pagesCount,
    actualPageIndex,
  } = processItems(items, { currentPageIndex: NaN }, { pagination: {} }));
  expect(actualPageIndex).toEqual(1);
  expect(pagesCount).toEqual(3);
  expect(processed).toHaveLength(10);
  expect(processed[0]).toEqual(items[0]);
});

test('displays all items of it is less than the page size', () => {
  const items = generateItems(7);
  const { items: processed, pagesCount } = processItems(items, {}, { pagination: {} });
  expect(pagesCount).toEqual(1);
  expect(processed).toEqual(items);
});

test('displays a middle page', () => {
  const items = generateItems(25);
  const {
    items: processed,
    pagesCount,
    actualPageIndex,
  } = processItems(items, { currentPageIndex: 2 }, { pagination: {} });
  expect(actualPageIndex).toEqual(2);
  expect(pagesCount).toEqual(3);
  expect(processed).toHaveLength(10);
  expect(processed[0]).toEqual(items[10]);
  expect(processed[9]).toEqual(items[19]);
});

test('displays the last page', () => {
  const items = generateItems(25);
  const { items: processed, pagesCount } = processItems(items, { currentPageIndex: 3 }, { pagination: {} });
  expect(pagesCount).toEqual(3);
  expect(processed).toHaveLength(5);
  expect(processed[0]).toEqual(items[20]);
  expect(processed[4]).toEqual(items[24]);
});

test('displays the last page with only one item', () => {
  const items = generateItems(11);
  const { items: processed, pagesCount } = processItems(items, { currentPageIndex: 2 }, { pagination: {} });
  expect(pagesCount).toEqual(2);
  expect(processed).toHaveLength(1);
  expect(processed).toEqual([items[10]]);
});

test('displays the last page when the number of items is divisible by page size', () => {
  const items = generateItems(20);
  const { items: processed, pagesCount } = processItems(items, { currentPageIndex: 2 }, { pagination: {} });
  expect(pagesCount).toEqual(2);
  expect(processed).toHaveLength(10);
  expect(processed[0]).toEqual(items[10]);
  expect(processed[9]).toEqual(items[19]);
});

test('supports custom page size', () => {
  const items = generateItems(35);
  const { items: processed, pagesCount } = processItems(
    items,
    { currentPageIndex: 2 },
    { pagination: { pageSize: 20 } }
  );
  expect(pagesCount).toEqual(2);
  expect(processed).toHaveLength(15);
  expect(processed[0]).toEqual(items[20]);
  expect(processed[14]).toEqual(items[34]);
});
