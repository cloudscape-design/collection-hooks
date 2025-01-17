// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe, vi } from 'vitest';
import { processItems } from '../../operations';
import { PropertyFilterOperator } from '../../interfaces';
import * as logging from '../../logging';

const propertyFiltering = {
  filteringProperties: [
    {
      key: 'id',
      operators: [':', '!:', '^', '!^'],
      groupValuesLabel: 'Id values',
      propertyLabel: 'Id',
    },
    {
      key: 'field',
      operators: [':', '!:', '^', '!^', '?'],
      groupValuesLabel: 'Field values',
      propertyLabel: 'Field',
    },
    {
      key: 'anotherField',
      operators: [':'],
      groupValuesLabel: 'Another field values',
      propertyLabel: 'Another field',
    },
    {
      key: 'number',
      operators: [':', '!:', '=', '!=', '<', '<=', '>', '>='],
      groupValuesLabel: 'Number values',
      propertyLabel: 'Number',
    },
    {
      key: 'default',
      groupValuesLabel: 'Default values',
      propertyLabel: 'Default',
    },
    {
      key: 'falsy',
      operators: [':', '!:', '=', '!=', '<', '<=', '>', '>='],
      groupValuesLabel: 'Falsy values',
      propertyLabel: 'Falsy',
    },
    {
      key: 'bool',
      operators: [':', '!:', '=', '!=', '<', '<=', '>', '>='],
      groupValuesLabel: 'Boolean values',
      propertyLabel: 'Boolean',
    },
  ],
} as const;

test('returns all items when query is empty', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const emtpyQuery = { tokens: [], operation: 'and' } as const;
  const { items: processed } = processItems(items, { propertyFilteringQuery: emtpyQuery }, { propertyFiltering });

  expect(processed).toEqual(items);
});

describe('operation', () => {
  const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, field: 'match me too' }, { id: 4 }];
  const twoTokens = [
    { propertyKey: 'field', operator: ':', value: 'match' },
    { propertyKey: 'field', operator: ':', value: 'me too' },
  ] as const;
  test('and', () => {
    const { items: processed } = processItems(
      items,
      { propertyFilteringQuery: { tokens: twoTokens, operation: 'and' } },
      { propertyFiltering }
    );
    expect(processed).toEqual([items[2]]);
  });
  test('or', () => {
    const { items: processed } = processItems(
      items,
      { propertyFilteringQuery: { tokens: twoTokens, operation: 'or' } },
      { propertyFiltering }
    );
    expect(processed).toEqual([items[0], items[2]]);
  });
});

describe('free text tokens', () => {
  test('match items by multiple properties', () => {
    const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, anotherField: 'match me too' }, { id: 4 }];
    const freeTextQuery = { tokens: [{ operator: ':', value: 'match me' }], operation: 'and' } as const;
    const { items: processed } = processItems(items, { propertyFilteringQuery: freeTextQuery }, { propertyFiltering });

    expect(processed).toEqual([items[0], items[2]]);
  });
  test('do not filter by a property, which does not support the operator of the token', () => {
    const items = [
      { id: 1, field: 'match me' },
      { id: 2, field: 'match me', anotherField: 'match me' },
      { id: 3, anotherField: 'match me too' },
      { id: 4 },
    ];
    const freeTextQuery = { tokens: [{ operator: '!:', value: 'match me' }], operation: 'and' } as const;
    const { items: processed } = processItems(items, { propertyFilteringQuery: freeTextQuery }, { propertyFiltering });

    expect(processed).toEqual([items[2], items[3]]);
  });
  test('can use other other operators than contains, including custom matchers', () => {
    const items = [
      { id: 1, field: 'match' },
      { id: 2, field: 'no match' },
      { id: 3, field: 'no match', arrayField: ['something else', 'match'] },
    ];
    const arrayProperty = {
      key: 'arrayField',
      operators: [
        {
          operator: '^',
          match: (value: unknown, token: any) => (value as string[])?.some(s => s.startsWith(token)),
        },
      ],
      propertyLabel: '',
      groupValuesLabel: '',
    };
    const freeTextQuery = { tokens: [{ operator: '^', value: 'mat' }], operation: 'and' } as const;
    const { items: processed } = processItems(
      items,
      { propertyFilteringQuery: freeTextQuery },
      {
        propertyFiltering: {
          filteringProperties: [...propertyFiltering.filteringProperties, arrayProperty],
        },
      }
    );

    expect(processed).toEqual([items[0], items[2]]);
  });
});

describe('Supported operators', () => {
  interface Item {
    number: number;
    default: string;
    falsy?: any;
    bool: boolean;
  }
  const items = Array.from({ length: 5 }, (_, index) => ({
    number: index,
    default: index + '',
    bool: !(index % 2),
  })) as ReadonlyArray<Item>;
  items[1].falsy = undefined;
  items[2].falsy = null;
  items[3].falsy = '';
  items[4].falsy = NaN;

  test.each<[PropertyFilterOperator, Item[]]>([
    [':', [items[2]]],
    ['!:', [items[0], items[1], items[3], items[4]]],
    ['=', [items[2]]],
    ['!=', [items[0], items[1], items[3], items[4]]],
    ['<', [items[0], items[1]]],
    ['<=', [items[0], items[1], items[2]]],
    ['>', [items[3], items[4]]],
    ['>=', [items[2], items[3], items[4]]],
  ])('%s', (operator, expected) => {
    const operatorQuery = { tokens: [{ propertyKey: 'number', operator, value: '2' }], operation: 'and' } as const;
    const { items: processed } = processItems(items, { propertyFilteringQuery: operatorQuery }, { propertyFiltering });
    expect(processed).toEqual(expected);
  });
  test('equals ("=") operator is supported on every property by default', () => {
    const operatorQuery = {
      tokens: [{ propertyKey: 'default', operator: '=', value: '3' }],
      operation: 'and',
    } as const;
    const { items: processed } = processItems(items, { propertyFilteringQuery: operatorQuery }, { propertyFiltering });
    expect(processed).toEqual([items[3]]);
  });
  test.each<PropertyFilterOperator>(['<', '<=', '>', '>=', ':', '!:', '!=', '^', '!^'])(
    '%s operator is not supported by default',
    operator => {
      const operatorQuery = {
        tokens: [{ propertyKey: 'default', operator, value: '3' }],
        operation: 'and',
      } as const;
      const { items: processed } = processItems(
        items,
        { propertyFilteringQuery: operatorQuery },
        { propertyFiltering }
      );
      expect(processed).toEqual([]);
    }
  );
  describe('treatment of the falsy values', () => {
    test('zero is treated as a number', () => {
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'number', operator: '<', value: '1' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual([items[0]]);
      }
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'number', operator: '=', value: '0' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual([items[0]]);
      }
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'number', operator: '>', value: '0' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual([items[1], items[2], items[3], items[4]]);
      }
    });
    test('missing value, null, undefined and NaN are treated like empty strings', () => {
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'falsy', operator: '<', value: 'a' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual(items);
      }
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'falsy', operator: '>=', value: 'a' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual([]);
      }
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'falsy', operator: '=', value: '' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual(items);
      }
      {
        const operatorQuery = {
          tokens: [{ propertyKey: 'falsy', operator: '!=', value: '' }],
          operation: 'and',
        } as const;
        const { items: processed } = processItems(
          items,
          { propertyFilteringQuery: operatorQuery },
          { propertyFiltering }
        );
        expect(processed).toEqual([]);
      }
    });
    test('boolean false is treated like the string "false"', () => {
      const operatorQuery = {
        tokens: [{ propertyKey: 'bool', operator: '=', value: 'false' }],
        operation: 'and',
      } as const;
      const { items: processed } = processItems(
        items,
        { propertyFilteringQuery: operatorQuery },
        { propertyFiltering }
      );
      expect(processed).toEqual([items[1], items[3]]);
    });
  });
});

test('"contains" operator is case-insensitive', () => {
  const items = [{ id: 1, field: 'match me' }, { id: 2 }, { id: 3, anotherField: 'match ME too' }, { id: 4 }];
  const freeTextQuery = { tokens: [{ operator: ':', value: 'match me' }], operation: 'and' } as const;
  const { items: processed } = processItems(items, { propertyFilteringQuery: freeTextQuery }, { propertyFiltering });
  expect(processed).toEqual([items[0], items[2]]);
});

test('"starts-with" operator matching', () => {
  const items = [
    { id: 1, field: 'match me' },
    { id: 2, field: 'match mee' },
    { id: 3, field: 'match ME too' },
    { id: 4, field: 'match not me' },
  ];
  const startsWithQuery = {
    tokens: [{ propertyKey: 'field', operator: '^', value: 'match me' }],
    operation: 'and',
  } as const;
  const { items: processed } = processItems(items, { propertyFilteringQuery: startsWithQuery }, { propertyFiltering });
  expect(processed).toEqual([items[0], items[1], items[2]]);
});

test('"not-starts-with" operator matching', () => {
  const items = [
    { id: 1, field: 'a' },
    { id: 2, field: 'ab' },
    { id: 3, field: 'bc' },
    { id: 4, field: 'bcd' },
    { id: 5, field: 'b' },
    { id: 6, field: 'c' },
    { id: 7, field: 'd' },
    { id: 8, field: '' },
    { id: 9, field: 'abc' },
    { id: 10, field: 'abcd' },
    { id: 11, field: 'abCd' },
  ];
  const startsWithQuery = {
    tokens: [{ propertyKey: 'field', operator: '!^', value: 'abc' }],
    operation: 'and',
  } as const;
  const { items: processed } = processItems(items, { propertyFilteringQuery: startsWithQuery }, { propertyFiltering });
  expect(processed).toEqual([items[0], items[1], items[2], items[3], items[4], items[5], items[6], items[7]]);
});

test('unsupported operator results in an exception', () => {
  const items = [{ id: 1, field: 'match me' }];
  const unsupportedOperatorQuery = {
    tokens: [{ propertyKey: 'field', operator: '?', value: '???' }],
    operation: 'and',
  } as const;
  expect(() =>
    processItems(items, { propertyFilteringQuery: unsupportedOperatorQuery }, { propertyFiltering })
  ).toThrow('Unsupported operator given.');
});

describe('filtering function', () => {
  test('Is called with the current query', () => {
    const items = [{ id: 1, field: 'match me' }];
    const spy = vi.fn();
    const query = { tokens: [], operation: 'and' } as const;
    processItems(
      items,
      { propertyFilteringQuery: query },
      {
        propertyFiltering: {
          ...propertyFiltering,
          filteringFunction: spy,
        },
      }
    );
    expect(spy).toHaveBeenCalledWith(items[0], query);
  });
  test('result is used for filtlering', () => {
    const items = [{ id: 1, field: 'match me' }];
    const spy = vi.fn();
    spy.mockReturnValue(false);
    const query = { tokens: [], operation: 'and' } as const;
    const { items: processed } = processItems(
      items,
      { propertyFilteringQuery: query },
      {
        propertyFiltering: {
          ...propertyFiltering,
          filteringFunction: spy,
        },
      }
    );
    expect(processed).toEqual([]);
  });
});

describe('extended operators', () => {
  interface Item {
    number: number;
    default: string;
    date: Date;
    timestamp: Date;
  }

  const items = Array.from({ length: 5 }, (_, index) => ({
    number: index,
    default: index + '',
    boolean: index % 2 === 0,
    date: new Date(`2020-01-0${index + 1}T12:00:00.123`),
    timestamp: new Date(`2020-01-01T0${index}:00:00.123`),
  })) as readonly Item[];

  test('supports extended operators', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'number', operator: '=', value: '2' }],
          operation: 'and',
        },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'number',
              operators: [{ operator: '=' }, { operator: '!=' }],
              propertyLabel: '',
              groupValuesLabel: '',
            },
          ],
        },
      }
    );
    expect(processed).toEqual([items[2]]);
  });

  test('supports custom match', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'number', operator: '=', value: new Set([1, 2]) }],
          operation: 'and',
        },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'number',
              operators: [
                { operator: '=', match: (value, token) => token.has(value) },
                { operator: '!=', match: (value, token) => !token.has(value) },
              ],
              propertyLabel: '',
              groupValuesLabel: '',
            },
          ],
        },
      }
    );
    expect(processed).toEqual([items[1], items[2]]);
  });

  test('preserves falsy item values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'boolean', operator: '=', value: true }],
          operation: 'and',
        },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'boolean',
              operators: [{ operator: '=', match: (itemValue, tokenValue) => itemValue === tokenValue }],
              propertyLabel: '',
              groupValuesLabel: '',
            },
          ],
        },
      }
    );
    expect(processed).toEqual([items[0], items[2], items[4]]);
  });

  test.each([
    ['=', '2020-01-02', [items[1]]],
    ['!=', '2020-01-02', [items[0], items[2], items[3], items[4]]],
    ['<', '2020-01-02', [items[0]]],
    ['<=', '2020-01-02', [items[0], items[1]]],
    ['>', '2020-01-02', [items[2], items[3], items[4]]],
    ['>=', '2020-01-02', [items[1], items[2], items[3], items[4]]],
    [':', '2020-01-02', []],
  ] as const)('supports date match %s', (operator, value, expectedResult) => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'date', operator, value }],
          operation: 'and',
        },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'date',
              operators: [
                { operator: '=', match: 'date' },
                { operator: '!=', match: 'date' },
                { operator: '<', match: 'date' },
                { operator: '<=', match: 'date' },
                { operator: '>', match: 'date' },
                { operator: '>=', match: 'date' },
                { operator: ':', match: 'date' }, // unsupported
              ],
              propertyLabel: '',
              groupValuesLabel: '',
            },
          ],
        },
      }
    );
    expect(processed).toEqual(expectedResult);
  });

  test.each([
    ['<', '2020-01-01T01:00:00', [items[0]]],
    ['<=', '2020-01-01T01:00:00', [items[0]]],
    ['>', '2020-01-01T01:00:00', [items[1], items[2], items[3], items[4]]],
    ['>=', '2020-01-01T01:00:00', [items[1], items[2], items[3], items[4]]],
    [':', '2020-01-01T01:00:00', []],
  ] as const)('supports datetime match %s', (operator, value, expectedResult) => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'timestamp', operator, value }],
          operation: 'and',
        },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'timestamp',
              operators: [
                { operator: '=', match: 'datetime' },
                { operator: '!=', match: 'datetime' },
                { operator: '<', match: 'datetime' },
                { operator: '<=', match: 'datetime' },
                { operator: '>', match: 'datetime' },
                { operator: '>=', match: 'datetime' },
                { operator: ':', match: 'datetime' }, // unsupported
              ],
              propertyLabel: '',
              groupValuesLabel: '',
            },
          ],
        },
      }
    );
    expect(processed).toEqual(expectedResult);
  });

  test.each([
    { match: 'date' as const, operator: ':' },
    { match: 'date' as const, operator: '^' },
    { match: 'datetime' as const, operator: ':' },
  ])('warns if unsupported operator "$operator" given for match="$match"', ({ match, operator }) => {
    const warnOnce = vi.spyOn(logging, 'warnOnce');
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'timestamp', operator, value: '' }],
          operation: 'and',
        },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'timestamp',
              operators: [
                { operator: ':', match },
                { operator: '^', match },
              ],
              propertyLabel: '',
              groupValuesLabel: '',
            },
          ],
        },
      }
    );
    expect(processed).toEqual([]);
    expect(warnOnce).toHaveBeenCalledWith(`Unsupported operator "${operator}" given for match="${match}".`);
  });

  test('throws if unexpected operator.match', () => {
    expect(() =>
      processItems(
        items,
        {
          propertyFilteringQuery: {
            tokens: [{ propertyKey: 'timestamp', operator: '=', value: '2020-01-01T01:00:00' }],
            operation: 'and',
          },
        },
        {
          propertyFiltering: {
            filteringProperties: [
              {
                key: 'timestamp',
                operators: [
                  { operator: '=', match: 'date-time' as any },
                  { operator: '!=', match: (value, token) => !token.has(value) },
                ],
                propertyLabel: '',
                groupValuesLabel: '',
              },
            ],
          },
        }
      )
    ).toThrow('Unsupported `operator.match` type given.');
  });
});

describe('matching enum token', () => {
  const obj = { value: 0 };
  const items = [
    /* index=0 */ { status: 'ACTIVE' },
    /* index=1 */ { status: 'ACTIVATING' },
    /* index=2 */ { status: 'NOT_ACTIVE' },
    /* index=3 */ { status: 'DEACTIVATING' },
    /* index=4 */ { status: 'TERMINATED' },
    /* index=5 */ { status: 0 },
    /* index=6 */ { status: obj },
  ];

  function processWithProperty(propertyKey: string, operator: string, token: any, itemsOverride = items) {
    return processItems(
      itemsOverride,
      {
        propertyFilteringQuery: { operation: 'and', tokens: [{ propertyKey, operator, value: token }] },
      },
      {
        propertyFiltering: {
          filteringProperties: [
            {
              key: 'status',
              operators: [
                { operator: '=', tokenType: 'enum' },
                { operator: '!=', tokenType: 'enum' },
                { operator: ':', tokenType: 'enum' },
                { operator: '!:', tokenType: 'value' },
              ],
              groupValuesLabel: 'Status values',
              propertyLabel: 'Status',
            },
          ],
        },
      }
    ).items;
  }

  test.each(['=', '!=', ':'])('matches nothing when token=null and operator="%s"', operator => {
    const processed = processWithProperty('status', operator, null);
    expect(processed).toEqual([]);
  });

  test.each(['=', '!=', ':'])('matches nothing when token="" and operator="%s"', operator => {
    const processed = processWithProperty('status', operator, '');
    expect(processed).toEqual([]);
  });

  test('matches all when token=[] and operator="!="', () => {
    const processed = processWithProperty('status', '!=', []);
    expect(processed).toEqual(items);
  });

  test('matches nothing when token=[] and operator="="', () => {
    const processed = processWithProperty('status', '=', []);
    expect(processed).toEqual([]);
  });

  test.each([{ token: ['NOT_ACTIVE', 'ACTIVE'] }])('matches some when token=$token and operator="="', ({ token }) => {
    const processed = processWithProperty('status', '=', token);
    expect(processed).toEqual([items[0], items[2]]);
  });

  test.each([{ token: [obj, 0] }])('matches some when token=$token and operator="="', ({ token }) => {
    const processed = processWithProperty('status', '=', token);
    expect(processed).toEqual([items[5], items[6]]);
  });

  test.each([{ token: ['ACTIVE', 'NOT_ACTIVE'] }])('matches some when token=$token and operator="!="', ({ token }) => {
    const processed = processWithProperty('status', '!=', token);
    expect(processed).toEqual([items[1], items[3], items[4], items[5], items[6]]);
  });

  test.each([{ token: [0, obj] }])('matches some when token=$token and operator="!="', ({ token }) => {
    const processed = processWithProperty('status', '!=', token);
    expect(processed).toEqual([items[0], items[1], items[2], items[3], items[4]]);
  });

  test.each([['ACTIVE'], 'ACTIVE'])('matches nothing when token=%s and operator=":"', token => {
    const processed = processWithProperty('status', ':', token);
    expect(processed).toEqual([]);
  });

  test('matches some when token="ING" and operator="!:"', () => {
    const processed = processWithProperty('status', '!:', 'ING');
    expect(processed).toEqual([items[0], items[2], items[4], items[5], items[6]]);
  });

  test('warns when unsupported operator is used', () => {
    const warnOnce = vi.spyOn(logging, 'warnOnce');
    processWithProperty('status', ':', []);
    expect(warnOnce).toHaveBeenCalledWith('Unsupported operator ":" given for tokenType=="enum".');
  });

  test('warns when token is not an array', () => {
    const warnOnce = vi.spyOn(logging, 'warnOnce');
    processWithProperty('status', '=', null);
    expect(warnOnce).toHaveBeenCalledWith('The token value must be an array when tokenType=="enum".');
  });
});

describe('Token groups', () => {
  test('token groups have precedence over tokens', () => {
    const { items: processed } = processItems(
      [{ field: 'A' }, { field: 'B' }],
      {
        propertyFilteringQuery: {
          operation: 'and',
          tokens: [{ propertyKey: 'field', operator: '=', value: 'A' }],
          tokenGroups: [{ propertyKey: 'field', operator: '=', value: 'B' }],
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual([{ field: 'B' }]);
  });

  test('filters by two OR token groups', () => {
    const { items: processed } = processItems(
      [
        { field: 'A1', anotherField: 'A2' },
        { field: 'A2', anotherField: 'A1' },
        { field: 'A1', anotherField: 'A3' },
        { field: 'A3', anotherField: 'A1' },
        { field: 'A2', anotherField: 'A3' },
        { field: 'A3', anotherField: 'A2' },
        { field: 'A3', anotherField: 'A3' },
      ],
      {
        propertyFilteringQuery: {
          operation: 'and',
          tokens: [],
          tokenGroups: [
            {
              operation: 'or',
              tokens: [
                { propertyKey: 'field', operator: '=', value: 'A1' },
                { propertyKey: 'anotherField', operator: '=', value: 'A1' },
              ],
            },
            {
              operation: 'or',
              tokens: [
                { propertyKey: 'field', operator: '=', value: 'A2' },
                { propertyKey: 'anotherField', operator: '=', value: 'A2' },
              ],
            },
          ],
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual([
      { field: 'A1', anotherField: 'A2' },
      { field: 'A2', anotherField: 'A1' },
    ]);
  });

  test('filters by two AND token groups', () => {
    const { items: processed } = processItems(
      [
        { field: 'A1', anotherField: 'A1' },
        { field: 'A2', anotherField: 'A2' },
        { field: 'A1', anotherField: 'A2' },
        { field: 'A2', anotherField: 'A1' },
        { field: 'A3', anotherField: 'A3' },
      ],
      {
        propertyFilteringQuery: {
          operation: 'or',
          tokens: [],
          tokenGroups: [
            {
              operation: 'and',
              tokens: [
                { propertyKey: 'field', operator: '=', value: 'A1' },
                { propertyKey: 'anotherField', operator: '=', value: 'A1' },
              ],
            },
            {
              operation: 'and',
              tokens: [
                { propertyKey: 'field', operator: '=', value: 'A2' },
                { propertyKey: 'anotherField', operator: '=', value: 'A2' },
              ],
            },
          ],
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual([
      { field: 'A1', anotherField: 'A1' },
      { field: 'A2', anotherField: 'A2' },
    ]);
  });

  test('filters by a deeply nested group', () => {
    const { items: processed } = processItems(
      [
        { field: 'A1', anotherField: 'A1' },
        { field: 'A2', anotherField: 'A2' },
        { field: 'A1', anotherField: 'A2' },
        { field: 'A2', anotherField: 'A1' },
        { field: 'A1', anotherField: 'A3' },
        { field: 'A3', anotherField: 'A1' },
        { field: 'A2', anotherField: 'A3' },
        { field: 'A3', anotherField: 'A2' },
        { field: 'A3', anotherField: 'A3' },
      ],
      {
        propertyFilteringQuery: {
          operation: 'or',
          tokens: [],
          tokenGroups: [
            {
              operation: 'and',
              tokens: [
                {
                  operation: 'or',
                  tokens: [
                    { propertyKey: 'field', operator: '=', value: 'A1' },
                    { propertyKey: 'anotherField', operator: '=', value: 'A1' },
                  ],
                },
                {
                  operation: 'or',
                  tokens: [
                    { propertyKey: 'field', operator: '=', value: 'A2' },
                    { propertyKey: 'anotherField', operator: '=', value: 'A2' },
                  ],
                },
              ],
            },
            {
              operation: 'or',
              tokens: [
                {
                  operation: 'and',
                  tokens: [
                    { propertyKey: 'field', operator: '=', value: 'A1' },
                    { propertyKey: 'anotherField', operator: '=', value: 'A1' },
                  ],
                },
                {
                  operation: 'and',
                  tokens: [
                    { propertyKey: 'field', operator: '=', value: 'A2' },
                    { propertyKey: 'anotherField', operator: '=', value: 'A2' },
                  ],
                },
              ],
            },
          ],
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual([
      { field: 'A1', anotherField: 'A1' },
      { field: 'A2', anotherField: 'A2' },
      { field: 'A1', anotherField: 'A2' },
      { field: 'A2', anotherField: 'A1' },
    ]);
  });
});
