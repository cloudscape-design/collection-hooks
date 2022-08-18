// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates } from '../utils/compare-dates';

jest.mock('../utils/get-browser-timezone-offset', () => ({
  getBrowserTimezoneOffset: jest.fn().mockReturnValue(0),
}));

test.each([
  ['2020-01-01', '2020-01-01', 0],
  ['2020-01-01', '2020-01-02', -1],
  ['2020-01-02', '2020-01-01', 1],
])('compares dates correctly', (date, dateToCompare, compareResult) => {
  expect(Math.sign(compareDates(date, dateToCompare))).toBe(compareResult);
});
