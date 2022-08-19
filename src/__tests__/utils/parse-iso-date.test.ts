// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from '../../utils/parse-iso-date';

jest.mock('../../utils/get-browser-timezone-offset', () => ({
  getBrowserTimezoneOffset: jest.fn().mockReturnValue(60),
}));

test.each([
  ['2020-01-01', new Date('2020-01-01')],
  ['2020-01-01T01:02:03', new Date('2020-01-01T02:02:03')],
  ['2020-01-01T01:02:03+2:00', new Date('2020-01-01T03:02:03')],
])('parses date correctly', (dateString, expectedDate) => {
  expect(parseIsoDate(dateString).getTime()).toBe(expectedDate.getTime());
});

test.each([['2020-01-0x'], ['2020-01-01T01:02:0x'], ['2020-01-01T01:02:03+2:xx']])(
  'returns invalid date if cannot parse',
  dateString => {
    expect(parseIsoDate(dateString).getTime()).toBe(NaN);
  }
);
