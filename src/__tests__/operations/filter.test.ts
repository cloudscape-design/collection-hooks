// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe, vi } from 'vitest';
import { processItems } from '../../operations';

test('returns all items when filtering text is empty', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const { items: processed } = processItems(items, { filteringText: '' }, { filtering: {} });

  expect(processed).toEqual(items);
});

test('returns all items when filtering text is undefined', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const { items: processed } = processItems(items, {}, { filtering: {} });

  expect(processed).toEqual(items);
});

test('works properly when all fields are included', () => {
  const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, anotherField: 'match me too' }, { id: 4 }];
  const { items: processed } = processItems(items, { filteringText: 'match me' }, { filtering: {} });

  expect(processed).toEqual([items[0], items[2]]);
});

test('is case-insensitive', () => {
  const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, anotherField: 'match me too' }, { id: 4 }];
  let { items: processed } = processItems(items, { filteringText: 'match me' }, { filtering: {} });
  expect(processed).toEqual([items[0], items[2]]);

  ({ items: processed } = processItems(items, { filteringText: 'Match ME' }, { filtering: {} }));

  expect(processed).toEqual([items[0], items[2]]);
});

describe('with filteringFields', () => {
  test('supports filtering by certain fields', () => {
    const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, anotherField: 'match me too' }, { id: 4 }];
    const { items: processed } = processItems(
      items,
      { filteringText: 'match me' },
      { filtering: { fields: ['field'] } }
    );

    expect(processed).toEqual([items[0]]);
  });

  test('does not show anything if the fields in filteringFields are not present in the items', () => {
    const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, anotherField: 'match me too' }, { id: 4 }];
    const { items: processed } = processItems(
      items,
      { filteringText: 'match me' },
      { filtering: { fields: ['fictional'] } }
    );

    expect(processed).toEqual([]);
  });

  describe('non-string data handling', () => {
    test('matches number literals', () => {
      const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 20 }];
      const { items: processed } = processItems(items, { filteringText: '2' }, { filtering: {} });

      expect(processed).toEqual([items[1], items[3]]);
    });

    test('matches boolean literal "true"', () => {
      const items = [{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }, { id: 4 }];
      const { items: processed } = processItems(items, { filteringText: 'true' }, { filtering: {} });

      expect(processed).toEqual([items[0], items[2]]);
    });

    test('matches boolean literal "false"', () => {
      const items = [{ id: 1, active: true }, { id: 2, active: false }, { id: 3, active: true }, { id: 4 }];
      const { items: processed } = processItems(items, { filteringText: 'false' }, { filtering: {} });

      expect(processed).toEqual([items[1]]);
    });

    test('matches null', () => {
      const items = [{ id: 1 }, { id: 2, value: null }, { id: 3, value: null }, { id: 4 }];
      const { items: processed } = processItems(items, { filteringText: 'null' }, { filtering: {} });
      expect(processed).toEqual([items[1], items[2]]);
    });

    test('matches undefined', () => {
      const items = [{ id: 1, value: false }, { id: 2, value: undefined }, { id: 3, value: true }, { id: 4 }];
      const { items: processed } = processItems(items, { filteringText: 'undef' }, { filtering: {} });
      expect(processed).toEqual([items[1]]);
    });
  });
});

describe('with filteringFunction', () => {
  test('filters items correctly', () => {
    const items = [{ id: 1, field: 'match me' }, { id: 2, field: 'not me' }, { id: 3, field: 'match me' }, { id: 4 }];
    const { items: processed } = processItems(
      items,
      { filteringText: 'match me' },
      {
        filtering: {
          // filteringFunction that returns true if the text is NOT found
          filteringFunction: (item, text) => !item.field || !item.field.includes(text),
        },
      }
    );

    expect(processed).toEqual([items[1], items[3]]);
  });

  test('passes filtering text and fields into filtering function', () => {
    const filteringSpy = vi.fn(() => true);
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { items: processed } = processItems(
      items,
      { filteringText: 'test' },
      {
        filtering: {
          fields: ['id'],
          filteringFunction: filteringSpy,
        },
      }
    );
    expect(processed).toHaveLength(3);
    expect(filteringSpy).toHaveBeenCalledTimes(3);
    expect(filteringSpy).toHaveBeenCalledWith(expect.any(Object), 'test', ['id']);
  });

  test('applies custom filteringFunction even if filtering text is empty', () => {
    const filteringSpy = vi.fn(() => true);
    const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
    const { items: processed } = processItems(
      items,
      {},
      {
        filtering: { filteringFunction: filteringSpy },
      }
    );
    expect(processed).toHaveLength(3);
    expect(filteringSpy).toHaveBeenCalledTimes(3);
    expect(filteringSpy).toHaveBeenCalledWith(expect.any(Object), '', undefined);
  });
});
