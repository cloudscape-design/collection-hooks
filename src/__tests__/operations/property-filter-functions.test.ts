// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { processItems, filteringFunctionDate } from '../../operations';
import { FilteringProperty } from '../../interfaces';

const items = [
  { date: '2020-01-01', dateTime: '2020-01-01T15:30:00' },
  { date: '2020-01-02', dateTime: '2020-01-02T02:22:21' },
  { date: '2020-01-02', dateTime: '2020-01-02T02:22:22' },
  { date: '2020-01-02', dateTime: '2020-01-02T02:22:23' },
  { date: '2020-01-02', dateTime: '2020-01-02T23:59:59' },
  { date: '2020-01-03', dateTime: '2020-01-03T13:33:33' },
];

function pick<T>(array: T[], indices: number[]): T[] {
  const selected: T[] = [];
  for (const index of indices) {
    selected.push(array[index]);
  }
  return selected;
}

const propertyFiltering = {
  filteringProperties: [
    {
      key: 'date',
      operators: ['=', '!=', '<', '<=', '>', '>=', 'IN'],
      groupValuesLabel: 'Date value',
      propertyLabel: 'Date',
      filteringFunction: filteringFunctionDate,
    },
    {
      key: 'dateTime',
      operators: ['=', '!=', '<', '<=', '>', '>=', 'IN'],
      groupValuesLabel: 'Date-time value',
      propertyLabel: 'Date-time',
      filteringFunction: filteringFunctionDate,
    },
  ] as FilteringProperty<any>[],
} as const;

describe('date filtering function', () => {
  test('matches date object values', () => {
    const dateItems = items.map(({ date, dateTime }) => ({ date: new Date(date), dateTime: new Date(dateTime) }));
    const { items: processed } = processItems(
      dateItems,
      {
        propertyFilteringQuery: {
          tokens: [
            { propertyKey: 'date', operator: '=', value: '2020-01-02' },
            { propertyKey: 'dateTime', operator: '=', value: '2020-01-03T13:33:33' },
          ],
          operation: 'or',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(dateItems, [1, 2, 3, 4, 5]));
  });

  test('date equals matches date values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'date', operator: '=', value: '2020-01-02' }],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [1, 2, 3, 4]));
  });

  test('date equals matches date-time values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'dateTime', operator: '=', value: '2020-01-02T02:22:22' }],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [2]));
  });

  test('date not equal matches date values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'date', operator: '!=', value: '2020-01-02' }],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [0, 5]));
  });

  test('date not equal matches date-time values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [{ propertyKey: 'dateTime', operator: '!=', value: '2020-01-02T02:22:22' }],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [0, 1, 3, 4, 5]));
  });

  test('less than and greater than match date values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [
            { propertyKey: 'date', operator: '>', value: '2020-01-01' },
            { propertyKey: 'date', operator: '<', value: '2020-01-03' },
          ],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [1, 2, 3, 4]));
  });

  test('less than and greater than match date-time values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [
            { propertyKey: 'dateTime', operator: '>', value: '2020-01-02T02:22:21' },
            { propertyKey: 'dateTime', operator: '<', value: '2020-01-02T23:59:59' },
          ],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [2, 3]));
  });

  test('less than or equals and greater than or equals match date values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [
            { propertyKey: 'date', operator: '>=', value: '2020-01-01' },
            { propertyKey: 'date', operator: '<=', value: '2020-01-02' },
          ],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [0, 1, 2, 3, 4]));
  });

  test('less than or equals and greater than or equals match date-time values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [
            { propertyKey: 'dateTime', operator: '>=', value: '2020-01-02T02:22:21' },
            { propertyKey: 'dateTime', operator: '<=', value: '2020-01-02T23:59:59' },
          ],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [1, 2, 3, 4]));
  });

  test('in range absolute matches date values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [
            {
              propertyKey: 'date',
              operator: 'IN',
              value: '{ "type": "absolute", "startDate": "2020-01-02", "endDate": "2020-01-03" }',
            },
          ],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [1, 2, 3, 4, 5]));
  });

  test('in range absolute matches date-time values', () => {
    const { items: processed } = processItems(
      items,
      {
        propertyFilteringQuery: {
          tokens: [
            {
              propertyKey: 'dateTime',
              operator: 'IN',
              value: '{ "type": "absolute", "startDate": "2020-01-02T02:22:22", "endDate": "2020-01-02T02:22:23" }',
            },
          ],
          operation: 'and',
        },
      },
      { propertyFiltering }
    );
    expect(processed).toEqual(pick(items, [2, 3]));
  });

  test('in range relative matches date values', () => {
    try {
      jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-04'));
      const { items: processed } = processItems(
        items,
        {
          propertyFilteringQuery: {
            tokens: [
              {
                propertyKey: 'date',
                operator: 'IN',
                value: '{ "type": "relative", "unit": "day", "amount": 1 }',
              },
            ],
            operation: 'and',
          },
        },
        { propertyFiltering }
      );
      expect(processed).toEqual(pick(items, [5]));
    } finally {
      jest.useRealTimers();
    }
  });

  test('in range relative matches date-time values', () => {
    try {
      jest.useFakeTimers('modern').setSystemTime(new Date('2020-01-02T02:22:24'));
      const { items: processed } = processItems(
        items,
        {
          propertyFilteringQuery: {
            tokens: [
              {
                propertyKey: 'dateTime',
                operator: 'IN',
                value: '{ "type": "relative", "unit": "second", "amount": 2 }',
              },
            ],
            operation: 'and',
          },
        },
        { propertyFiltering }
      );
      expect(processed).toEqual(pick(items, [2, 3]));
    } finally {
      jest.useRealTimers();
    }
  });
});
