// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates, compareDateTime } from '../../utils/compare-dates';

const localTimezoneOffsetInHours = (0 - new Date('2020-01-01').getTimezoneOffset()) / 60;

const second = 1 * 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

test.each([
  [new Date('2020-01-01'), new Date('2020-01-01'), 0],
  [new Date('2020-01-02'), new Date('2020-01-01'), day],
  [new Date('2020-01-01'), new Date('2020-01-02'), -day],
  [new Date('2020-01-01T01:01:01'), new Date('2020-01-01T02:02:02'), 0],
  [new Date('2020-01-01T23:59:59'), new Date('2020-01-01T00:00:00'), 0],
  [
    shiftTimezone(new Date('2020-01-01T23:59:59Z'), localTimezoneOffsetInHours),
    shiftTimezone(new Date('2020-01-02T00:00:00Z'), localTimezoneOffsetInHours),
    -day,
  ],
])('compares dates %s - %s', (date, dateToCompare, compareResult) => {
  expect(compareDates(date, dateToCompare)).toBe(compareResult);
});

test.each([
  [new Date('2020-01-01T01:01:01'), new Date('2020-01-01T01:01:01'), 0],
  [new Date('2020-01-01T01:01:02'), new Date('2020-01-01T01:01:01'), second],
  [new Date('2020-01-01T01:01:01'), new Date('2020-01-01T02:02:02'), -hour - minute - second],
  [new Date('2020-01-01T01:01:01Z'), new Date('2020-01-01T01:01:01Z'), 0],
  [new Date('2020-01-01T23:59:59Z'), new Date('2020-01-01T23:59:59'), localTimezoneOffsetInHours * hour],
  [
    shiftTimezone(new Date('2020-01-01T23:59:59Z'), localTimezoneOffsetInHours),
    shiftTimezone(new Date('2020-01-02T00:00:00Z'), localTimezoneOffsetInHours),
    -second,
  ],
])('compares timestamps %s %s', (date, dateToCompare, compareResult) => {
  expect(compareDateTime(date, dateToCompare)).toBe(compareResult);
});

test.each([
  [new Date('2020-01-01'), new Date('xxxx-xx-xx'), NaN],
  [new Date('xxxx-xx-xx'), new Date('2020-01-01'), NaN],
  [new Date('xxxx-xx-xx'), new Date('xxxx-xx-xx'), NaN],
])('handles invalid dates %s %s', (date, dateToCompare, compareResult) => {
  expect(compareDates(date, dateToCompare)).toBe(compareResult);
  expect(compareDateTime(date, dateToCompare)).toBe(compareResult);
});

function shiftTimezone(date: Date, timezoneOffsetInHours: number): Date {
  return new Date(date.getTime() - timezoneOffsetInHours * 60 * 60 * 1000);
}
