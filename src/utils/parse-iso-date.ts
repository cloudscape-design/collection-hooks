// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function parseIsoDate(isoDate: string): Date {
  const [datePart = '', timeAndOffset = ''] = (isoDate ?? '').split('T');
  const [timePart, signCharacter, offsetPart] = timeAndOffset.split(/(-|\+)/);
  const [yearStr, monthStr, dayStr] = datePart.split('-');
  const [hoursStr, minutesStr, secondsStr] = timePart.replace(/(\.\d\d\d)?Z/, '').split(':');

  const year = Number(yearStr);
  const month = Number(monthStr) - 1;
  const day = Number(dayStr);
  const hours = Number(hoursStr);
  const minutes = Number(minutesStr);
  const seconds = Number(secondsStr);

  if (!timePart) {
    return new Date(Date.UTC(year, month, day));
  }

  // Instantiate date as UTC if found the UTC timezone indicator.
  if (isoDate.indexOf('Z') !== -1) {
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  }

  // Instantiate date with explicitly defined offset.
  if (signCharacter && offsetPart) {
    const [offsetHours, offsetMinutes] = offsetPart.split(':');
    const timezoneOffset = Number(signCharacter + '1') * (Number(offsetHours) * 60 + Number(offsetMinutes));
    return new Date(Date.UTC(year, month, day, hours, minutes, seconds) + timezoneOffset * 60 * 1000);
  }

  // Instantiate date with the current timezone offset.
  return new Date(year, month, day, hours, minutes, seconds);
}
