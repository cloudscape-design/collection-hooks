// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates, compareTimestamps } from '../utils/compare-dates.js';
import { parseIsoDate } from '../utils/parse-iso-date.js';

export function matchDateIsEqual(date: unknown, dateToCompare: unknown): boolean {
  const comparator = isTimestamp(dateToCompare) ? compareTimestamps : compareDates;
  return comparator(parseDateArgument(date), parseDateArgument(dateToCompare)) === 0;
}

export function matchDateIsNotEqual(date: unknown, dateToCompare: unknown): boolean {
  const comparator = isTimestamp(dateToCompare) ? compareTimestamps : compareDates;
  return comparator(parseDateArgument(date), parseDateArgument(dateToCompare)) !== 0;
}

export function matchDateIsBefore(date: unknown, dateToCompare: unknown): boolean {
  const comparator = isTimestamp(dateToCompare) ? compareTimestamps : compareDates;
  return comparator(parseDateArgument(date), parseDateArgument(dateToCompare)) < 0;
}

export function matchDateIsBeforeOrEqual(date: unknown, dateToCompare: unknown): boolean {
  return matchDateIsBefore(date, dateToCompare) || matchDateIsEqual(date, dateToCompare);
}

export function matchDateIsAfter(date: unknown, dateToCompare: unknown): boolean {
  const comparator = isTimestamp(dateToCompare) ? compareTimestamps : compareDates;
  return comparator(parseDateArgument(date), parseDateArgument(dateToCompare)) > 0;
}

export function matchDateIsAfterOrEqual(date: unknown, dateToCompare: unknown): boolean {
  return matchDateIsAfter(date, dateToCompare) || matchDateIsEqual(date, dateToCompare);
}

function parseDateArgument(date: unknown): Date {
  if (date instanceof Date) {
    return date;
  }
  if (typeof date === 'string') {
    return parseIsoDate(date);
  }
  return new Date(NaN);
}

function isTimestamp(date: unknown): boolean {
  return date instanceof Date || (typeof date === 'string' && date.includes('T'));
}
