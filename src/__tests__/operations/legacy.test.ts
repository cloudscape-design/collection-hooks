// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { sort } from '../../operations/sort';
import { filter } from '../../operations/filter';
import { propertyFilter } from '../../operations/property-filter';

const items = [
  { id: 1, value: 'a' },
  { id: 2, value: 'ab' },
  { id: 3, value: 'abc' },
  { id: 4, value: 'abcd' },
  { id: 5, value: 'bcd' },
  { id: 6, value: 'cd' },
  { id: 7, value: 'd' },
];

test('legacy sort returns same array when state is empty', () => {
  const sorted = sort(items, undefined);
  expect(sorted).toBe(items);
});

test('legacy sort sorts the array', () => {
  const sorted = sort([items[2], items[1]], { sortingColumn: { sortingField: 'value' } });
  expect(sorted).toEqual([items[1], items[2]]);
});

test('legacy filter returns same array when state is empty', () => {
  const filtered = filter(items, '', {});
  expect(filtered).toEqual(items);
});

test('legacy filter filters the array', () => {
  const filtered = filter(items, 'bc', {});
  expect(filtered).toHaveLength(3);
});

test('legacy property filter returns same array when state is empty', () => {
  const filtered = propertyFilter(
    items,
    { operation: 'and', tokens: [] },
    { filteringProperties: [{ key: 'value', operators: [':'], propertyLabel: '', groupValuesLabel: '' }] }
  );
  expect(filtered).toEqual(items);
});

test('legacy property filter filters the array', () => {
  const filtered = propertyFilter(
    items,
    { operation: 'and', tokens: [{ operator: ':', value: 'bc' }] },
    { filteringProperties: [{ key: 'value', operators: [':'], propertyLabel: '', groupValuesLabel: '' }] }
  );
  expect(filtered).toHaveLength(3);
});
