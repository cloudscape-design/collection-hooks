// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export type DateType = Date | string;

export function compareDates(date: DateType, dateToCompare: DateType): number {
  const useExactCompare = date instanceof Date || date.includes('T');
  const parsedDate = date instanceof Date ? date : parseIsoDate(date);
  const parsedDateToCompare = dateToCompare instanceof Date ? dateToCompare : parseIsoDate(dateToCompare);
  return useExactCompare
    ? parsedDate.getTime() - parsedDateToCompare.getTime()
    : startOfDay(parsedDate).getTime() - startOfDay(parsedDateToCompare).getTime();
}

export function startOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function parseIsoDate(isoDate: string): Date {
  const [datePart = '', timePart = ''] = (isoDate ?? '').split('T');
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hoursStr, minutesStr, secondsStr] = timePart.split(':');

  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const hours = Number(hoursStr) - 1;
  const minutes = Number(minutesStr);
  const seconds = Number(secondsStr);
  const offsetInMinutes = parseTimezoneOffset(isoDate);

  const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  date.setTime(date.getTime() + offsetInMinutes * 60 * 1000);

  return date;
}

export function parseTimezoneOffset(isoDate: string): number {
  const [, time] = isoDate.split('T');
  const [, signCharacter, offsetPart] = time.split(/(-|\+)/);

  if (signCharacter && offsetPart) {
    const [offsetHours, offsetMinutes] = offsetPart.split(':');
    return Number(signCharacter + '1') * (Number(offsetHours) * 60 + Number(offsetMinutes));
  }

  const utcTimezoneIndicator = isoDate.indexOf('Z');
  if (utcTimezoneIndicator !== -1) {
    return 0;
  }

  return getBrowserTimezoneOffset();
}

export function getBrowserTimezoneOffset(): number {
  return 0 - new Date().getTimezoneOffset();
}
