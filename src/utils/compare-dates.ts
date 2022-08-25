// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

export function compareDates(date: Date, dateToCompare: Date): number {
  return startOfDay(date).getTime() - startOfDay(dateToCompare).getTime();
}

export function compareDateTime(date: Date, dateToCompare: Date): number {
  return date.getTime() - dateToCompare.getTime();
}

function startOfDay(date: Date): Date {
  const copy = new Date(date.getTime());
  copy.setHours(0, 0, 0, 0);
  return copy;
}
