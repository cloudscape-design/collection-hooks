// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { parseTimezoneOffset } from './parse-timezone-offset.js';

export function parseIsoDate(isoDate: string): Date {
  const [datePart = '', timeAndOffset = ''] = (isoDate ?? '').split('T');
  const [timePart] = timeAndOffset.split(/(-|\+)/);
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hoursStr, minutesStr, secondsStr] = timePart.split(':');

  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const seconds = Number(secondsStr);
  const offsetInMinutes = parseTimezoneOffset(isoDate);

  if (timePart) {
    const date = new Date(year, month, day, hours, minutes, seconds);
    date.setTime(date.getTime() + offsetInMinutes * 60 * 1000);
    return date;
  }

  return new Date(year, month, day);
}
