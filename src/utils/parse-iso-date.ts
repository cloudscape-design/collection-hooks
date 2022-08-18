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
  const hours = Number(hoursStr) - 1;
  const minutes = Number(minutesStr);
  const seconds = Number(secondsStr);
  const offsetInMinutes = parseTimezoneOffset(isoDate);

  const date = timePart
    ? new Date(Date.UTC(year, month, day, hours, minutes, seconds))
    : new Date(Date.UTC(year, month, day, 0, 0, 0));
  date.setTime(date.getTime() + offsetInMinutes * 60 * 1000);

  return date;
}
