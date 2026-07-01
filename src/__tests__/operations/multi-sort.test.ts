// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect } from 'vitest';
import { processItems } from '../../operations';

const items = [
  { group: 'b', n: 1 },
  { group: 'a', n: 2 },
  { group: 'a', n: 1 },
  { group: 'b', n: 2 },
];

test('sorts by the first column, then breaks ties with subsequent columns in priority order', () => {
  const { items: processed } = processItems(
    items,
    {
      sortingColumns: [
        { sortingColumn: { sortingField: 'group' }, isDescending: false },
        { sortingColumn: { sortingField: 'n' }, isDescending: true },
      ],
    },
    { sorting: { multiColumn: true } }
  );
  // group ascending; within each group, n descending
  expect(processed).toEqual([
    { group: 'a', n: 2 },
    { group: 'a', n: 1 },
    { group: 'b', n: 2 },
    { group: 'b', n: 1 },
  ]);
});

test('respects per-column direction independently', () => {
  const { items: processed } = processItems(
    items,
    {
      sortingColumns: [
        { sortingColumn: { sortingField: 'group' }, isDescending: true },
        { sortingColumn: { sortingField: 'n' }, isDescending: false },
      ],
    },
    { sorting: { multiColumn: true } }
  );
  expect(processed).toEqual([
    { group: 'b', n: 1 },
    { group: 'b', n: 2 },
    { group: 'a', n: 1 },
    { group: 'a', n: 2 },
  ]);
});

test('a single entry behaves like single-column sort', () => {
  const { items: processed } = processItems(
    items,
    { sortingColumns: [{ sortingColumn: { sortingField: 'n' } }] },
    { sorting: { multiColumn: true } }
  );
  expect(processed.map(i => i.n)).toEqual([1, 1, 2, 2]);
});

test('empty sortingColumns leaves the order unchanged', () => {
  const { items: processed } = processItems(items, { sortingColumns: [] }, { sorting: { multiColumn: true } });
  expect(processed).toEqual(items);
});

test('preserves original order when every sort column compares equal', () => {
  const data = [
    { group: 'a', n: 1 },
    { group: 'a', n: 1 },
    { group: 'a', n: 1 },
  ];
  const { items: processed } = processItems(
    data,
    {
      sortingColumns: [{ sortingColumn: { sortingField: 'group' } }, { sortingColumn: { sortingField: 'n' } }],
    },
    { sorting: { multiColumn: true } }
  );
  // All comparators return 0 for every pair -> the composed comparator returns 0 -> stable (original) order.
  expect(processed).toEqual(data);
});

test('supports custom comparators per column', () => {
  const byLength = (a: { group: string }, b: { group: string }) => a.group.length - b.group.length;
  const data = [
    { group: 'bb', n: 1 },
    { group: 'a', n: 2 },
    { group: 'a', n: 1 },
    { group: 'bb', n: 2 },
  ];
  const { items: processed } = processItems(
    data,
    {
      sortingColumns: [
        { sortingColumn: { sortingComparator: byLength } },
        { sortingColumn: { sortingField: 'n' }, isDescending: true },
      ],
    },
    { sorting: { multiColumn: true } }
  );
  expect(processed).toEqual([
    { group: 'a', n: 2 },
    { group: 'a', n: 1 },
    { group: 'bb', n: 2 },
    { group: 'bb', n: 1 },
  ]);
});
