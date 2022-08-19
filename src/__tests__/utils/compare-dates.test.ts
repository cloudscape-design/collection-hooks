// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates } from '../../utils/compare-dates';

jest.mock('../../utils/get-browser-timezone-offset', () => ({
  getBrowserTimezoneOffset: jest.fn().mockReturnValue(0),
}));

test.each([
  ['2020-01-01', '2020-01-01', 0],
  ['2020-01-01', '2020-01-02', -1],
  ['2020-01-02', '2020-01-01', 1],
])('compares dates', (date, dateToCompare, compareResult) => {
  expect(Math.sign(compareDates(date, dateToCompare))).toBe(compareResult);
});

test.each([
  ['2020-01-01T00:00:01', '2020-01-01T00:00:01', 0],
  ['2020-01-01T00:02:01', '2020-01-01T00:01:01', 1],
  ['2020-01-01T00:01:01', '2020-01-01T00:02:01', -1],
  ['2020-01-02T00:00:01', '2020-01-01T00:00:01', 1],
])('compares date-time', (date, dateToCompare, compareResult) => {
  expect(Math.sign(compareDates(date, dateToCompare))).toBe(compareResult);
});

test.each([
  ['2020-01-01T00:00:01+2:00', '2020-01-01T00:00:01+2:00', 0],
  ['2020-01-01T00:00:01+1:00', '2020-01-01T00:00:01+2:00', -1],
  ['2020-01-01T00:00:01+2:00', '2020-01-01T00:00:01+1:00', 1],
  ['2020-01-01T00:00:01-2:00', '2020-01-01T00:00:01-1:00', -1],
  ['2020-01-01T00:00:01-1:00', '2020-01-01T00:00:01-2:00', 1],
  ['2020-01-01T00:00:02+1:00', '2020-01-01T00:00:01+1:00', 1],
  ['2020-01-01T00:00:02+1:00', '2020-01-01T00:00:01+1:02', -1],
])('compares date-time with timezone offset', (date, dateToCompare, compareResult) => {
  expect(Math.sign(compareDates(date, dateToCompare))).toBe(compareResult);
});

test.each([
  ['2020-01-01', '2020-xx-xx', NaN],
  ['2020-xx-xx', '2020-01-01', NaN],
  ['2020-xx-xx', '2020-xx-xx', NaN],
])('handles invalid dates', (date, dateToCompare, compareResult) => {
  expect(Math.sign(compareDates(date, dateToCompare))).toBe(compareResult);
});
