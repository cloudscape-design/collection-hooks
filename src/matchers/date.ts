// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates, compareTimestamps } from '../utils/compare-dates.js';
import { parseIsoDate } from '../utils/parse-iso-date.js';

export function matchDateIsEqual(itemDate: Date, tokenDate: Date | string): boolean {
  const comparator = isTimestamp(tokenDate) ? compareTimestamps : compareDates;
  return comparator(parseItemDate(itemDate), parseTokenDate(tokenDate)) === 0;
}

export function matchDateIsNotEqual(itemDate: Date, tokenDate: Date | string): boolean {
  const comparator = isTimestamp(tokenDate) ? compareTimestamps : compareDates;
  return comparator(parseItemDate(itemDate), parseTokenDate(tokenDate)) !== 0;
}

export function matchDateIsBefore(itemDate: Date, tokenDate: Date | string): boolean {
  const comparator = isTimestamp(tokenDate) ? compareTimestamps : compareDates;
  return comparator(parseItemDate(itemDate), parseTokenDate(tokenDate)) < 0;
}

export function matchDateIsBeforeOrEqual(itemDate: Date, tokenDate: Date | string): boolean {
  return matchDateIsBefore(itemDate, tokenDate) || matchDateIsEqual(itemDate, tokenDate);
}

export function matchDateIsAfter(itemDate: Date, tokenDate: Date | string): boolean {
  const comparator = isTimestamp(tokenDate) ? compareTimestamps : compareDates;
  return comparator(parseItemDate(itemDate), parseTokenDate(tokenDate)) > 0;
}

export function matchDateIsAfterOrEqual(itemDate: Date, tokenDate: Date | string): boolean {
  return matchDateIsAfter(itemDate, tokenDate) || matchDateIsEqual(itemDate, tokenDate);
}

function parseItemDate(date: unknown): Date {
  if (date instanceof Date) {
    return date;
  }
  return new Date(NaN);
}

function parseTokenDate(date: unknown): Date {
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
