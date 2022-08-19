// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from '../../utils/parse-iso-date';

const timezoneOffsetInHours = (0 - new Date().getTimezoneOffset()) / 60;

test.each([
  // Date-only
  ['2020-01-01', [2020, 0, 1, 0, 0, 0]],
  // Date-time with UTC offset
  ['2020-01-01T01:02:03Z', [2020, 0, 1, 1, 2, 3]],
  ['2020-01-01T01:02:03.123Z', [2020, 0, 1, 1, 2, 3]],
  ['2020-01-01T01:02:03+0:00', [2020, 0, 1, 1, 2, 3]],
  // Date-time with explicit offset
  ['2020-01-01T01:00:03+1:30', [2020, 0, 1, 2, 30, 3]],
  // Date-time with explicit offset (negative)
  ['2020-01-01T01:00:00-2:00', [2019, 11, 31, 23, 0, 0]],
  // Date-time with browser's offset
  ['2020-01-01T10:00:00', [2020, 0, 1, 10 + timezoneOffsetInHours, 0, 0]],
])('parses date correctly', (dateString, [year, month, date, hours, minutes, seconds]) => {
  const parsed = parseIsoDate(dateString);
  expect(parsed.getUTCFullYear()).toBe(year);
  expect(parsed.getUTCMonth()).toBe(month);
  expect(parsed.getUTCDate()).toBe(date);
  expect(parsed.getUTCHours()).toBe(hours);
  expect(parsed.getUTCMinutes()).toBe(minutes);
  expect(parsed.getUTCSeconds()).toBe(seconds);
});

test.each([['2020-01-0x'], ['2020-01-01T01:02:0x'], ['2020-01-01T01:02:03+2:xx']])(
  'returns invalid date if cannot parse',
  dateString => {
    expect(parseIsoDate(dateString).getTime()).toBe(NaN);
  }
);
