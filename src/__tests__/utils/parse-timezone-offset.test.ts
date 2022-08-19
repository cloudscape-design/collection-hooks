// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseTimezoneOffset } from '../../utils/parse-timezone-offset';

jest.mock('../../utils/get-browser-timezone-offset', () => ({
  getBrowserTimezoneOffset: jest.fn().mockReturnValue(88),
}));

test.each([
  ['2020-01-01', 0],
  ['2020-01-01T00:00-1:06', -66],
  ['2020-01-01T00:00+1:17', +77],
  ['2020-01-01T00:00:00.123Z', 0],
  ['2020-01-01T00:00:00', 88],
])('parses timezone offset correctly', (dateString, expectedOffset) => {
  expect(parseTimezoneOffset(dateString)).toBe(expectedOffset);
});
