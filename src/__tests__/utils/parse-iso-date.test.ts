// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from '../../utils/parse-iso-date';

jest.mock('../../utils/get-browser-timezone-offset', () => ({
  getBrowserTimezoneOffset: jest.fn().mockReturnValue(60),
}));

test.each([
  ['2020-01-01', [2020, 0, 1, 0, 0, 0]],
  ['2020-01-01T00:00:00', [2020, 0, 1, 1, 0, 0]],
  ['2020-01-01T01:02:02', [2020, 0, 1, 2, 2, 2]],
  ['2020-01-01T01:02:02+2:00', [2020, 0, 1, 3, 2, 2]],
  ['2020-01-01T01:02:02-1:00', [2020, 0, 1, 0, 2, 2]],
])('parses date correctly', (dateString, [year, month, date, hours, minutes, seconds]) => {
  const parsed = parseIsoDate(dateString);
  expect(parsed.getFullYear()).toBe(year);
  expect(parsed.getMonth()).toBe(month);
  expect(parsed.getDate()).toBe(date);
  expect(parsed.getHours()).toBe(hours);
  expect(parsed.getMinutes()).toBe(minutes);
  expect(parsed.getSeconds()).toBe(seconds);
});

test.each([['2020-01-0x'], ['2020-01-01T01:02:0x'], ['2020-01-01T01:02:03+2:xx']])(
  'returns invalid date if cannot parse',
  dateString => {
    expect(parseIsoDate(dateString).getTime()).toBe(NaN);
  }
);
