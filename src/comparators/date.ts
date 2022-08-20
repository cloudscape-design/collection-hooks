// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareTimestamps } from '../utils/compare-dates.js';
import { parseIsoDate } from '../utils/parse-iso-date.js';

export function dateComparator(date: unknown, dateToCompare: unknown): number {
  return compareTimestamps(toDate(date), toDate(dateToCompare));
}

function toDate(date: unknown): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    return parseIsoDate(date);
  }
  return new Date(NaN);
}
