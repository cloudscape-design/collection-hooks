// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { processItems } from '../../operations';
import { FilteringProperty, Operator } from '../../interfaces';

const propertyFiltering = {
  filteringProperties: [
    {
      key: 'id',
      operators: [':', '!:'],
      groupValuesLabel: 'Id values',
      propertyLabel: 'Id',
    },
    {
      key: 'field',
      operators: [':', '!:'],
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
      operators: [':', '!:', '=', '!=', '<', '<=', '>', '>=', 'IN'],
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
  ] as FilteringProperty<any>[],
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

  test.each<[Operator, Item[]]>([
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
  test.each<Operator>(['<', '<=', '>', '>=', ':', '!:', '!='])('%s operator is not supported by default', operator => {
    const operatorQuery = {
      tokens: [{ propertyKey: 'default', operator, value: '3' }],
      operation: 'and',
    } as const;
    const { items: processed } = processItems(items, { propertyFilteringQuery: operatorQuery }, { propertyFiltering });
    expect(processed).toEqual([]);
  });
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

describe('filtering function', () => {
  test('Is called with the current query', () => {
    const items = [{ id: 1, field: 'match me' }];
    const spy = jest.fn();
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
    const spy = jest.fn();
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

describe('property filtering function', () => {
  test('overrides default matcher', () => {
    const items = [{ number: 0 }, { number: 2 }, { number: 4 }];
    const filteringProperties = propertyFiltering.filteringProperties.map(value => ({ ...value }));
    const numberProperty = filteringProperties.find(prop => prop.key === 'number')!;
    numberProperty.filteringFunction = (value: any, tokenValue: string, tokenOperator: Operator) => {
      return value === 2 && tokenValue === '1..3' && tokenOperator === 'IN';
    };
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'number', operator: 'IN', value: '1..3' }],
          operation: 'and',
        },
      },
      { propertyFiltering: { filteringProperties } }
    );
    expect(processed).toEqual([items[1]]);
  });

  test('cannot be used with unlisted operators', () => {
    const items = [{ number: 1 }, { number: 2 }, { number: 3 }];
    const filteringProperties = propertyFiltering.filteringProperties.map(value => ({ ...value }));
    const numberProperty = filteringProperties.find(prop => prop.key === 'number')!;
    numberProperty.operators = ['=', '!=', '<', '<=', '>', '>='];
    numberProperty.filteringFunction = jest.fn();
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'number', operator: 'IN', value: '1..3' }],
          operation: 'and',
        },
      },
      { propertyFiltering: { filteringProperties } }
    );
    expect(processed).toEqual([]);
    expect(numberProperty.filteringFunction).not.toHaveBeenCalled();
  });

  test('can be used with object values', () => {
    const items = [{ number: { value: 1 } }, { number: { value: 2 } }, { number: { value: 4 } }];
    const filteringProperties = propertyFiltering.filteringProperties.map(value => ({ ...value }));
    const numberProperty = filteringProperties.find(prop => prop.key === 'number')!;
    numberProperty.filteringFunction = (value: any, tokenValue: string, tokenOperator: Operator) => {
      return value.value >= 1 && value.value <= 3 && tokenValue === '1..3' && tokenOperator === 'IN';
    };
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'number', operator: 'IN', value: '1..3' }],
          operation: 'and',
        },
      },
      { propertyFiltering: { filteringProperties } }
    );
    expect(processed).toEqual([items[0], items[1]]);
  });
});
