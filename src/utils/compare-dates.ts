// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseIsoDate } from './parse-iso-date.js';
import { startOfDay } from './start-of-day.js';

export type DateType = Date | string;

export function compareDates(date: DateType, dateToCompare: DateType): number {
  const useExactCompare = date instanceof Date || date.includes('T');
  const parsedDate = date instanceof Date ? date : parseIsoDate(date);
  const parsedDateToCompare = dateToCompare instanceof Date ? dateToCompare : parseIsoDate(dateToCompare);
  return useExactCompare
    ? parsedDate.getTime() - parsedDateToCompare.getTime()
    : startOfDay(parsedDate).getTime() - startOfDay(parsedDateToCompare).getTime();
}
