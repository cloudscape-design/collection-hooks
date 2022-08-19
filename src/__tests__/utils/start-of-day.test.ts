// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { startOfDay } from '../../utils/start-of-day';

test('removes time part from a date', () => {
  expect(startOfDay(new Date('2020-01-01T11:11:11')).getTime()).toEqual(new Date('2020-01-01T00:00:00').getTime());
});
