// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe } from 'vitest';
import { compareDates, compareTimestamps } from '../../date-utils/compare-dates';

const localTimezoneOffset = 0 - new Date('2020-01-01').getTimezoneOffset();

const second = 1 * 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

test.each([
  ['2020-01-01' as any, '2020-01-01', NaN],
  [new Date('2020-01-01'), new Date('2020-01-01') as any, NaN],
  [new Date('2020-01-01'), 'NaN', NaN],
  [new Date(NaN), '2020-01-01', NaN],
  [new Date(NaN), 'NaN', NaN],
])('handles invalid dates %s %s', (date, dateToCompare, compareResult) => {
  expect(compareDates(date, dateToCompare)).toBe(compareResult);
  expect(compareTimestamps(date, dateToCompare)).toBe(compareResult);
});

describe('compareDates', () => {
  test.each([
    [new Date('2020-01-01T00:00:00'), '2020-01-01', 0],
    [new Date('2020-01-01T23:59:59'), '2020-01-01', 0],
    [new Date('2020-01-02T00:00:00'), '2020-01-01', day],
    [new Date('2020-01-01T00:00:00'), '2020-01-02', -day],
  ])('compares dates in local timezone %s - %s', (date, dateToCompare, compareResult) => {
    expect(compareDates(new Date(date), dateToCompare)).toBe(compareResult);
  });

  test.each([
    [shiftTimezone(new Date('2020-01-01T00:00:00Z'), localTimezoneOffset), '2020-01-01', 0],
    [shiftTimezone(new Date('2020-01-01T23:59:59Z'), localTimezoneOffset), '2020-01-01', 0],
  ])('compares dates in server timezone %s - %s', (date, dateToCompare, compareResult) => {
    expect(compareDates(new Date(date), dateToCompare)).toBe(compareResult);
  });
});

describe('compareTimestamps', () => {
  test.each([
    [new Date('2020-01-01T00:00:00'), '2020-01-01', 0],
    [new Date('2020-01-01T23:59:59'), '2020-01-01T23:59:59', 0],
    [new Date('2020-01-01T00:00:01'), '2020-01-01T00:00:00', second],
    [new Date('2020-01-01T00:00:01'), '2020-01-02', second - day],
  ])('compares timestamps in local timezone %s - %s', (date, dateToCompare, compareResult) => {
    expect(compareTimestamps(new Date(date), dateToCompare)).toBe(compareResult);
  });

  test.each([
    [shiftTimezone(new Date('2020-01-01T00:00:00Z'), localTimezoneOffset), '2020-01-01T00:00:00', 0],
    [shiftTimezone(new Date('2020-01-01T23:59:59Z'), localTimezoneOffset), '2020-01-01T23:59:59', 0],
  ])('compares timestamps in server timezone %s - %s', (date, dateToCompare, compareResult) => {
    expect(compareTimestamps(new Date(date), dateToCompare)).toBe(compareResult);
  });
});

function shiftTimezone(date: Date, timezoneOffset: number) {
  return new Date(date.getTime() - timezoneOffset * minute);
}
