// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates } from '../utils/compare-dates.js';

/*
  The date type can be represented as a Date object or ISO8601 date or date-time string, examples:
  - new Date("2020-01-01")
  - "2020-01-01"
  - "2020-01-01T15:30:00"
  - "2020-01-01T15:30:00+2:00"

  Every matcher function takes two arguments. If the first argument is a Date object or date-time string,
  the dates are compared as milliseconds. Otherwise - compare as dates but consider the second value timezone.
*/

export function matchDateIsEqual(date: Date | string, dateToCompare: Date | string): boolean {
  return compareDates(date, dateToCompare) === 0;
}

export function matchDateIsNotEqual(date: Date | string, dateToCompare: Date | string): boolean {
  return compareDates(date, dateToCompare) !== 0;
}

export function matchDateIsBefore(date: Date | string, dateToCompare: Date | string): boolean {
  return compareDates(date, dateToCompare) < 0;
}

export function matchDateIsBeforeOrEqual(date: Date | string, dateToCompare: Date | string): boolean {
  return matchDateIsBefore(date, dateToCompare) || matchDateIsEqual(date, dateToCompare);
}

export function matchDateIsAfter(date: Date | string, dateToCompare: Date | string): boolean {
  return compareDates(date, dateToCompare) > 0;
}

export function matchDateIsAfterOrEqual(date: Date | string, dateToCompare: Date | string): boolean {
  return matchDateIsAfter(date, dateToCompare) || matchDateIsEqual(date, dateToCompare);
}
