// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function parseIsoDate(isoDate: string): Date {
  if (typeof isoDate === 'string') {
    if (isoDate.includes('T')) {
      return new Date(isoDate);
    } else {
      return new Date(isoDate + 'T00:00:00');
    }
  }
  return new Date(NaN);
}
