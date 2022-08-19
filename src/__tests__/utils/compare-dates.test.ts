// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates } from '../../utils/compare-dates';

const timezoneOffsetInHours = (0 - new Date('2020-01-01').getTimezoneOffset()) / 60;

const second = 1 * 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

test.each([
  ['2020-01-01', '2020-01-01', 0],
  ['2020-01-01', '2020-01-02', -day],
  ['2020-01-02', '2020-01-01', day],
])('compares date strings against date strings', (itemDate, tokenDate, compareResult) => {
  expect(compareDates(itemDate, tokenDate)).toBe(compareResult);
});

test.each([
  ['2020-01-01', '2020-01-01T00:00:00Z', 0],
  ['2020-01-01', '2020-01-01T01:01:01Z', -(hour + minute + second)],
  ['2020-01-01', '2020-01-01T00:00:00-1:00', hour],
  ['2020-01-01', '2020-01-01T00:00:00', timezoneOffsetInHours * hour],
])('compares date strings against date-time strings', (itemDate, tokenDate, compareResult) => {
  expect(compareDates(itemDate, tokenDate)).toBe(compareResult);
});

test.each([
  ['2020-01-01T00:00:00', '2020-01-01', 0],
  ['2020-01-01T10:00:00', '2020-01-01', 0],
  ['2020-01-01T23:00:00', '2020-01-01', 0],
  ['2020-01-01T23:00:00Z', '2020-01-01', day],
])('compares date-time strings against date strings', (itemDate, tokenDate, compareResult) => {
  expect(compareDates(itemDate, tokenDate)).toBe(compareResult);
});

test.each([
  ['2020-01-01T00:00:00Z', '2020-01-01T00:00:00Z', 0],
  ['2020-01-01T00:00:00', '2020-01-01T00:00:00', 0],
  ['2020-01-01T00:00:01', '2020-01-01T00:00:00', second],
  ['2020-01-01T02:02:02+1:00', '2020-01-01T02:02:02+2:00', -hour],
  ['2020-01-01T00:00:00Z', '2020-01-01T00:00:00', timezoneOffsetInHours * hour],
])('compares date-time strings against date-time strings', (itemDate, tokenDate, compareResult) => {
  expect(compareDates(itemDate, tokenDate)).toBe(compareResult);
});

test.each([
  [new Date('2020-01-01'), '2020-01-01', 0],
  [new Date('2020-01-01'), '2020-01-02', -day],
  [new Date('2020-01-02'), '2020-01-01', day],
  [new Date('2020-01-01T23:59:59'), '2020-01-02', -day],
])('compares date objects against date strings', (itemDate, tokenDate, compareResult) => {
  expect(compareDates(itemDate, tokenDate)).toBe(compareResult);
});

test.each([
  [new Date(Date.UTC(2020, 0, 1, 0, 0, 0)), '2020-01-01T00:00:00Z', 0],
  [new Date('2020-01-01T00:00:00'), '2020-01-01T00:00:00Z', -timezoneOffsetInHours * hour],
  [new Date('2020-01-01'), '2020-01-01T00:00:30Z', -30 * second],
  [new Date('2020-01-01'), '2020-01-01T00:00:00', timezoneOffsetInHours * hour],
  [new Date('2020-01-01T00:00:00'), '2020-01-01T00:00:00', 0],
  [new Date('2020-01-01T00:00:00'), `2020-01-01T00:00:00-${timezoneOffsetInHours}:00`, 0],
])('compares date objects against date-time strings', (itemDate, tokenDate, compareResult) => {
  expect(compareDates(itemDate, tokenDate)).toBe(compareResult);
});

test.each([
  ['2020-01-01', 'xxxx-xx-xx', NaN],
  ['xxxx-xx-xx', '2020-01-01', NaN],
  ['xxxx-xx-xx', 'xxxx-xx-xx', NaN],
])('handles invalid dates', (date, dateToCompare, compareResult) => {
  expect(Math.sign(compareDates(date, dateToCompare))).toBe(compareResult);
});
