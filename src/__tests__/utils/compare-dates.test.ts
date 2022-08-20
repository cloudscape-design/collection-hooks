// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates, compareTimestamps } from '../../utils/compare-dates';

const timezoneOffsetInHours = (0 - new Date('2020-01-01').getTimezoneOffset()) / 60;

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
  [new Date('2020-01-01T23:59:59Z'), new Date('2020-01-01T23:59:59'), day],
])('compares dates', (date, dateToCompare, compareResult) => {
  expect(compareDates(date, dateToCompare)).toBe(compareResult);
});

test.each([
  [new Date('2020-01-01T01:01:01'), new Date('2020-01-01T01:01:01'), 0],
  [new Date('2020-01-01T01:01:02'), new Date('2020-01-01T01:01:01'), second],
  [new Date('2020-01-01T01:01:01'), new Date('2020-01-01T02:02:02'), -hour - minute - second],
  [new Date('2020-01-01T01:01:01Z'), new Date('2020-01-01T01:01:01Z'), 0],
  [new Date('2020-01-01T23:59:59Z'), new Date('2020-01-01T23:59:59'), timezoneOffsetInHours * hour],
])('compares timestamps', (date, dateToCompare, compareResult) => {
  expect(compareTimestamps(date, dateToCompare)).toBe(compareResult);
});

test.each([
  [new Date('2020-01-01'), new Date('xxxx-xx-xx'), NaN],
  [new Date('xxxx-xx-xx'), new Date('2020-01-01'), NaN],
  [new Date('xxxx-xx-xx'), new Date('xxxx-xx-xx'), NaN],
])('handles invalid dates', (date, dateToCompare, compareResult) => {
  expect(compareDates(date, dateToCompare)).toBe(compareResult);
  expect(compareTimestamps(date, dateToCompare)).toBe(compareResult);
});
