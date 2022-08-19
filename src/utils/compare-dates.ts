// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from './parse-iso-date.js';
import { startOfDay } from './start-of-day.js';

export function compareDates(date: Date | string, dateToCompare: string): number {
  const parsedDate = date instanceof Date ? date : parseIsoDate(date);
  const parsedDateToCompare = parseIsoDate(dateToCompare);
  return dateToCompare.includes('T')
    ? parsedDate.getTime() - parsedDateToCompare.getTime()
    : startOfDay(parsedDate).getTime() - startOfDay(parsedDateToCompare).getTime();
}
