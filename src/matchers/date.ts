// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { compareDates } from '../utils/compare-dates.js';

export function matchDateIsEqual(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(toDateOrDateString(date), toDateString(dateToCompare)) === 0;
}

export function matchDateIsNotEqual(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(toDateOrDateString(date), toDateString(dateToCompare)) !== 0;
}

export function matchDateIsBefore(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(toDateOrDateString(date), toDateString(dateToCompare)) < 0;
}

export function matchDateIsBeforeOrEqual(date: unknown, dateToCompare: unknown): boolean {
  return (
    matchDateIsBefore(toDateOrDateString(date), toDateString(dateToCompare)) ||
    matchDateIsEqual(toDateOrDateString(date), toDateString(dateToCompare))
  );
}

export function matchDateIsAfter(date: unknown, dateToCompare: unknown): boolean {
  return compareDates(toDateOrDateString(date), toDateString(dateToCompare)) > 0;
}

export function matchDateIsAfterOrEqual(date: unknown, dateToCompare: unknown): boolean {
  return (
    matchDateIsAfter(toDateOrDateString(date), toDateString(dateToCompare)) ||
    matchDateIsEqual(toDateOrDateString(date), toDateString(dateToCompare))
  );
}

function toDateOrDateString(date: unknown): Date | string {
  return date instanceof Date || typeof date === 'string' ? date : '';
}

function toDateString(date: unknown): string {
  return typeof date === 'string' ? date : '';
}
