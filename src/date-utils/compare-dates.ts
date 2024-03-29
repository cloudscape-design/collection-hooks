// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from './parse-iso-date.js';

/**
 * Compares dates up to a day.
 * @param date - item value as Date.
 * @param dateToCompare - token value as ISO8601 date string.
 * @returns diff in milliseconds between date and dateToCompare with a step of one day.
 */
export function compareDates(date: Date, dateToCompare: string): number {
  if (date instanceof Date && typeof dateToCompare === 'string') {
    return startOfDay(date).getTime() - startOfDay(parseIsoDate(dateToCompare)).getTime();
  }
  return NaN;
}

/**
 * Compares dates up to a millisecond.
 * @param date - item value as Date.
 * @param dateToCompare - token value as ISO8601 date string.
 * @returns diff in milliseconds between date and dateToCompare with a step of one millisecond.
 */
export function compareTimestamps(date: Date, dateToCompare: string): number {
  if (date instanceof Date && typeof dateToCompare === 'string') {
    return date.getTime() - parseIsoDate(dateToCompare).getTime();
  }
  return NaN;
}

function startOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}
