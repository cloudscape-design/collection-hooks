// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { dateComparator } from '../../comparators/date';

const timezoneOffsetInHours = (0 - new Date('2020-01-01').getTimezoneOffset()) / 60;

const second = 1 * 1000;
const minute = 60 * second;
const hour = 60 * minute;
const day = 24 * hour;

const testCases = [
  ['2020-01-01', new Date('2020-01-01'), 0],
  ['2020-01-01T00:00:00', new Date('2020-01-01T00:00:00'), 0],
  [`2020-01-01T00:00:00-${timezoneOffsetInHours}:00`, new Date('2020-01-01T00:00:00'), 0],
  ['2020-01-02', new Date('2020-01-01'), day],
  ['2020-01-02', new Date('2020-01-01T00:00:00'), day + timezoneOffsetInHours * hour],
];

test.each(testCases)('compares date string with date object', (date, dateToCompare, compareResult) => {
  expect(dateComparator(date, dateToCompare)).toBe(compareResult);
});

test.each(testCases)('compares date object with date string', (dateToCompare, date, compareResult) => {
  expect(dateComparator(date, dateToCompare)).toBe(Object.is(compareResult, 0) ? 0 : -compareResult);
});
