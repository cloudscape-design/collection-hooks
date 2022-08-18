// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getBrowserTimezoneOffset } from './get-browser-timezone-offset.js';

export function parseTimezoneOffset(isoDate: string): number {
  const [, time = ''] = isoDate.split('T');
  const [, signCharacter, offsetPart] = time.split(/(-|\+)/);

  if (!time) {
    return 0;
  }

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
