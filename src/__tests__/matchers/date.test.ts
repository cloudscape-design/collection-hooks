// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  matchDateIsEqual,
  matchDateIsNotEqual,
  matchDateIsAfter,
  matchDateIsAfterOrEqual,
  matchDateIsBefore,
  matchDateIsBeforeOrEqual,
} from '../../matchers/date';

const timezoneOffsetInHours = (0 - new Date('2020-01-01').getTimezoneOffset()) / 60;

const operatorToMatcher = {
  '=': matchDateIsEqual,
  '!=': matchDateIsNotEqual,
  '>': matchDateIsAfter,
  '>=': matchDateIsAfterOrEqual,
  '<': matchDateIsBefore,
  '<=': matchDateIsBeforeOrEqual,
};

test.each([
  ['2020-01-01T00:00:00', '2020-01-01T00:00:00', ['=', '<=', '>=']],
  ['2020-01-01T00:00:01', '2020-01-01T00:00:00', ['!=', '>', '>=']],
  ['2020-01-01T00:00:00', '2020-01-01T00:00:01', ['!=', '<', '<=']],
  ['2020-01-01Txx:xx:xx', '2020-01-01T00:00:00', ['!=']],
  ['2020-01-01T00:00:00', '2020-01-01Txx:xx:xx', ['!=']],
  ['2020-01-01Txx:xx:xx', '2020-01-01Txx:xx:xx', ['!=']],
] as [string, string, string[]][])('matchers return predictable results', (date, dateToCompare, expectedOperators) => {
  for (const operator of ['=', '!=', '>', '>=', '<', '<='] as const) {
    const matcher = operatorToMatcher[operator];
    expect(matcher(date, dateToCompare)).toBe(expectedOperators.includes(operator));
  }
});

test.each([
  ['2020-01-01T12:00:00', '2020-01-01', '='],
  [new Date('2020-01-01T12:00:00'), '2020-01-01', '='],
] as const)('matchers use date comparator when second argument is a date string', (date, dateToCompare, operator) => {
  const matcher = operatorToMatcher[operator];
  expect(matcher(date, dateToCompare)).toBe(true);
});

test.each([
  ['2020-01-01T12:00:00', '2020-01-01T11:59:59', '>'],
  [new Date('2020-01-01T12:00:00'), '2020-01-01T11:59:59', '>'],
] as const)(
  'matchers use timestamp comparator when second argument is a date-time string',
  (date, dateToCompare, operator) => {
    const matcher = operatorToMatcher[operator];
    expect(matcher(date, dateToCompare)).toBe(true);
  }
);

test.each([
  ['2020-01-01T12:00:00', new Date('2020-01-01'), '>'],
  [new Date('2020-01-01T12:00:00'), new Date('2020-01-01T11:59:59'), '>'],
] as const)(
  'matchers use timestamp comparator when second argument is a date object',
  (date, dateToCompare, operator) => {
    const matcher = operatorToMatcher[operator];
    expect(matcher(date, dateToCompare)).toBe(true);
  }
);

test.each([
  // UTC time
  ['2020-01-01T00:00:00Z', new Date('2020-01-01'), '='],
  ['2020-01-01T00:00:00+0:00', new Date('2020-01-01'), '='],
  // Local time
  [`2020-01-01T00:00:00-${timezoneOffsetInHours}:00`, new Date('2020-01-01T00:00:00'), '='],
  // Different timezones
  ['2020-01-01T01:00:00+1:00', '2020-01-01T00:00:00+2:00', '='],
  // Timezone and date
  ['2020-01-01T23:00:00+0:00', '2020-01-02', '='],
] as const)('timezones are handled as expected', (date, dateToCompare, operator) => {
  const matcher = operatorToMatcher[operator];
  expect(matcher(date, dateToCompare)).toBe(true);
});
