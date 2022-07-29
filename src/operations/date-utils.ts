// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { DateRange, DateTimeUnit, Operator } from '../interfaces';
import {
  startOfDay,
  endOfDay,
  subSeconds,
  subMinutes,
  subHours,
  subDays,
  subWeeks,
  subMonths,
  subYears,
} from 'date-fns';

/**
 * Parses value and returns corresponding Date object.
 * @param value Date or ISO8601 date (or date-time) string.
 * @returns Date object if the date is valid or null otherwise.
 */
export function parseDateValue(value: string | Date): null | Date {
  const date = value instanceof Date ? value : new Date(value);
  return !isNaN(date.getTime()) ? date : null;
}

/**
 * Parses date token value and operator and returns a filtering function to match the values against that.
 * @param value - Filter value as DatePickerProps.Value or DateRangePickerProps.Value (stringified).
 * @param operator - Filter operator.
 * @returns a filtering function to be applied on the date value.
 */
export function parseDateToken(value: unknown, operator: Operator): (date: Date) => boolean {
  const range = parseDateTokenValue(value);
  if (!range) {
    // Invalid token value.
    return () => false;
  }
  return (date: Date) => {
    switch (operator) {
      case '<':
        return date.getTime() < range.start.getTime();
      case '<=':
        return date.getTime() <= range.end.getTime();
      case '>':
        return date.getTime() > range.end.getTime();
      case '>=':
        return date.getTime() >= range.start.getTime();
      case '=':
      case 'IN':
        return date.getTime() >= range.start.getTime() && date.getTime() <= range.end.getTime();
      case '!=':
        return date.getTime() < range.start.getTime() || date.getTime() > range.end.getTime();
      default:
        // Unexpected operator.
        return false;
    }
  };
}

// The value is expected to be of type DatePickerProps.Value or DateRangePickerProps.Value (stringified).
function parseDateTokenValue(value: unknown): null | DateRange {
  // If value can be parsed as a valid date transform it to a date range and return.
  if (typeof value === 'string') {
    const date = parseDateValue(value);
    if (date) {
      return !value.includes('T') ? roundDateRangeToDay({ start: date, end: date }) : { start: date, end: date };
    }
  }

  if (typeof value === 'object' && value) {
    return parseDateRangePickerValue(value);
  }

  return null;
}

// The value is expected to be of type DateRangePickerProps.Value (stringified).
function parseDateRangePickerValue(value: Record<string, any>): null | DateRange {
  try {
    if (value.type === 'absolute') {
      const start = parseDateValue(value.startDate);
      const end = parseDateValue(value.endDate);
      if (!start || !end) {
        return null;
      }
      return !value.startDate.includes('T') ? roundDateRangeToDay({ start, end }) : { start, end };
    } else {
      return getRelativeDateRange(value.unit, value.amount);
    }
  } catch {
    // The value is not a valid JSON string.
    return null;
  }
}

// Creates relative range from DateRangePickerProps.TimeUnit and amount.
function getRelativeDateRange(unit: DateTimeUnit, amount: number): null | DateRange {
  const end = new Date();
  switch (unit) {
    case 'second':
      return { start: subSeconds(end, amount), end };
    case 'minute':
      return { start: subMinutes(end, amount), end };
    case 'hour':
      return { start: subHours(end, amount), end };
    case 'day':
      return { start: subDays(end, amount), end };
    case 'week':
      return { start: subWeeks(end, amount), end };
    case 'month':
      return { start: subMonths(end, amount), end };
    case 'year':
      return { start: subYears(end, amount), end };
    default:
      return null;
  }
}

function roundDateRangeToDay(range: DateRange): DateRange {
  return { start: startOfDay(range.start), end: endOfDay(range.end) };
}
