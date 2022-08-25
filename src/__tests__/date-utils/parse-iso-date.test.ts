// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from '../../date-utils/parse-iso-date';

test.each([
  '2020-01-01T00:00:00',
  '2020-01-01T23:59:59',
  '2020-01-01T23:59:59.123',
  '2020-01-01T23:59:59Z',
  '2020-01-01T23:59:59.123Z',
  '2020-01-01T23:59:59+00:00',
  '2020-01-01T23:59:59.123+00:00',
  '2020-01-01T23:59:59.123+08:00',
  '2020-01-01T23:59:59.123-08:00',
])('matches default parser', isoDate => {
  expect(parseIsoDate(isoDate).getTime()).toBe(new Date(isoDate).getTime());
});

test.each(['2020-01-01', '2020-07-01'])('parses date strings in local timezone', isoDate => {
  const localTimezoneOffsetInMilliseconds = (0 - new Date(isoDate).getTimezoneOffset()) * 60 * 1000;
  expect(parseIsoDate(isoDate).getTime()).toBe(new Date(isoDate).getTime() - localTimezoneOffsetInMilliseconds);
});
