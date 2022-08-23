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

const operatorToMatcher = {
  '=': matchDateIsEqual,
  '!=': matchDateIsNotEqual,
  '>': matchDateIsAfter,
  '>=': matchDateIsAfterOrEqual,
  '<': matchDateIsBefore,
  '<=': matchDateIsBeforeOrEqual,
};

test.each([
  [new Date('2020-01-01'), '2020-01-01', ['=', '<=', '>=']],
  [new Date('2020-01-01'), '2020-01-02', ['!=', '<', '<=']],
  [new Date('2020-01-01'), '2019-12-31', ['!=', '>', '>=']],
  [new Date('2020-01-01T12:00:00'), '2020-01-01', ['=', '<=', '>=']],
  [new Date('2020-01-01T00:00:00'), '2020-01-01T00:00:00', ['=', '<=', '>=']],
  [new Date('2020-01-01T00:00:01'), '2020-01-01T00:00:00', ['!=', '>', '>=']],
  [new Date('2020-01-01T00:00:00'), '2020-01-01T00:00:01', ['!=', '<', '<=']],
  [new Date('2020-01-01Txx:xx:xx'), '2020-01-01T00:00:00', ['!=']],
  [new Date('2020-01-01T00:00:00'), '2020-01-01Txx:xx:xx', ['!=']],
  [new Date('2020-01-01Txx:xx:xx'), '2020-01-01Txx:xx:xx', ['!=']],
] as [Date, string, string[]][])('matchers return predictable results', (date, dateToCompare, expectedOperators) => {
  for (const operator of ['=', '!=', '>', '>=', '<', '<='] as const) {
    const matcher = operatorToMatcher[operator];
    expect(matcher(date, dateToCompare)).toBe(expectedOperators.includes(operator));
  }
});

test.each([
  // Local timezone
  [new Date('2020-01-01T00:00:00'), new Date('2020-01-01T00:00:00')],
  [new Date('2020-01-01T23:59:59'), new Date('2020-01-01T23:59:59')],
  [new Date('2020-01-01T00:00:00'), '2020-01-01T00:00:00'],
  [new Date('2020-01-01T23:59:59'), '2020-01-01T23:59:59'],
  // UTC timezone
  [new Date('2020-01-01'), '2020-01-01'],
  [new Date('2020-01-01T00:00:00Z'), '2020-01-01'],
  [new Date('2020-01-01T00:00:00Z'), '2020-01-01T00:00:00Z'],
  [shiftTimezone(new Date('2020-01-01T00:00:00-08:00'), -8), '2020-01-01'],
  [shiftTimezone(new Date('2020-01-01T00:00:00+01:00'), 1), '2020-01-01'],
  [shiftTimezone(new Date('2020-01-01T23:00:00+01:00'), 1), '2020-01-02'],
  [shiftTimezone(new Date('2020-01-01T12:00:00+01:00'), 1), '2020-01-01T12:00:00Z'],
  // PST timezone (UTC-8:00)
  [shiftTimezone(new Date('2020-01-01'), -8), '2020-01-01T00:00:00-8:00'],
] as const)('timezones are handled as expected', (date, dateToCompare) => {
  expect(matchDateIsEqual(date, dateToCompare)).toBe(true);
});

function shiftTimezone(date: Date, timezoneOffsetInHours: number) {
  return new Date(date.getTime() + timezoneOffsetInHours * 60 * 60 * 1000);
}
