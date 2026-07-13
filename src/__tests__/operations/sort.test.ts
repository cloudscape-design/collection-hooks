// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { processItems } from '../../operations';

// ignore the prefix and compare only the numbers
const customComparator = (a: { id: string }, b: { id: string }) => {
  const first = a.id.split('-')[1];
  const second = b.id.split('-')[1];
  return first === second ? 0 : first > second ? 1 : -1;
};

test('does not sort items by default', () => {
  const items = [{ id: 1 }, { id: 3 }, { id: 2 }, { id: 4 }];
  const { items: processed } = processItems(items, {}, { sorting: {} });
  expect(processed).toEqual(items);
});

test('sort by column in default direction', () => {
  const items = [{ id: 1 }, { id: 3 }, { id: 4 }, { id: 2 }];
  const { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'id' } } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }]);
});

test('sort by column in reversed direction', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];
  const { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'id' }, isDescending: true } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 4 }, { id: 3 }, { id: 2 }, { id: 1 }]);
});

test('should have deterministic sorting for undefined values', () => {
  const items = [
    { id: 1, value: 'b' },
    { id: 2, value: undefined },
    { id: 3, value: null },
    { id: 4, value: 'a' },
  ];
  let { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'value' } } },
    { sorting: {} }
  );
  expect(processed).toEqual([items[1], items[2], items[3], items[0]]);
  ({ items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'value' }, isDescending: true } },
    { sorting: {} }
  ));
  expect(processed).toEqual([items[0], items[3], items[1], items[2]]);
});

test('should handle mixed data types in items', () => {
  const items = [{ id: 1 }, { id: '4' }, { id: '2' }, { id: 3 }];
  const { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'id' } } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 1 }, { id: '2' }, { id: 3 }, { id: '4' }]);
});

// Sorting should use localeCompare
test('should use locale-aware comparison for string types', () => {
  const items = [{ id: 'b' }, { id: 'a' }, { id: 'ä' }, { id: 'á' }];
  const { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'id' } } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 'a' }, { id: 'á' }, { id: 'ä' }, { id: 'b' }]);
});

test('should be case-insensitive by default', () => {
  const items = [{ id: 'A' }, { id: 'B' }, { id: 'a' }, { id: 'b' }];
  const { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'id' } } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 'a' }, { id: 'A' }, { id: 'b' }, { id: 'B' }]);
});

test('uses sortingComparator function when it is defined', () => {
  const items = [{ id: 'a-3' }, { id: 'b-2' }, { id: 'c-1' }, { id: 'd-4' }];
  let { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingComparator: customComparator } } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 'c-1' }, { id: 'b-2' }, { id: 'a-3' }, { id: 'd-4' }]);

  ({ items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingComparator: customComparator }, isDescending: true } },
    { sorting: {} }
  ));
  expect(processed).toEqual([{ id: 'd-4' }, { id: 'a-3' }, { id: 'b-2' }, { id: 'c-1' }]);
});

test('prefers comparator when both sortingField and sortingComparator are defined', () => {
  const items = [{ id: 'a-3' }, { id: 'b-2' }, { id: 'c-1' }, { id: 'd-4' }];
  const { items: processed } = processItems(
    items,
    { sortingState: { sortingColumn: { sortingField: 'id', sortingComparator: customComparator } } },
    { sorting: {} }
  );
  expect(processed).toEqual([{ id: 'c-1' }, { id: 'b-2' }, { id: 'a-3' }, { id: 'd-4' }]);
});

test('does not modify the items order, if neither sortingField nor sortingComparator are specified', () => {
  const items = [{ id: 'a-3' }, { id: 'b-2' }, { id: 'c-1' }, { id: 'd-4' }];
  const { items: processed } = processItems(items, { sortingState: { sortingColumn: {} } }, { sorting: {} });
  expect(processed).toEqual(items);
});
