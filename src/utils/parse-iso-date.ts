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

  const date = new Date(Date.UTC(year, month, day, hours, minutes, seconds));

  let timezoneOffset = 0;

  // No need to shift offset if found a UTC offset indicator.
  if (isoDate.indexOf('Z') !== -1) {
    timezoneOffset = 0;
  }
  // If offset is explicitly defined - try parsing it.
  else if (signCharacter && offsetPart) {
    const [offsetHours, offsetMinutes] = offsetPart.split(':');
    timezoneOffset = Number(signCharacter + '1') * (Number(offsetHours) * 60 + Number(offsetMinutes));
  }
  // Shift offset by browser's offset.
  else {
    // Taking offset of the corresponding date, not new Date() to account for dayling savings.
    timezoneOffset = 0 - date.getTimezoneOffset();
  }

  date.setTime(date.getTime() + timezoneOffset * 60 * 1000);

  return date;
}
