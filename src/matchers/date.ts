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

export function matchDateIsEqual(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(normalizeDate(date), normalizeDate(dateToCompare)) === 0;
}

export function matchDateIsNotEqual(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(normalizeDate(date), normalizeDate(dateToCompare)) !== 0;
}

export function matchDateIsBefore(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(normalizeDate(date), normalizeDate(dateToCompare)) < 0;
}

export function matchDateIsBeforeOrEqual(date: unknown, dateToCompare: unknown): boolean {
  return (
    matchDateIsBefore(normalizeDate(date), normalizeDate(dateToCompare)) ||
    matchDateIsEqual(normalizeDate(date), normalizeDate(dateToCompare))
  );
}

export function matchDateIsAfter(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(normalizeDate(date), normalizeDate(dateToCompare)) > 0;
}

export function matchDateIsAfterOrEqual(date: unknown, dateToCompare: unknown): boolean {
  return (
    matchDateIsAfter(normalizeDate(date), normalizeDate(dateToCompare)) ||
    matchDateIsEqual(normalizeDate(date), normalizeDate(dateToCompare))
  );
}

function normalizeDate(date: unknown): Date | string {
  return date instanceof Date || typeof date === 'string' ? date : '';
}
