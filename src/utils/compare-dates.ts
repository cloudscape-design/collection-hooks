// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { startOfDay } from './start-of-day.js';

export function compareDates(date: Date, dateToCompare: Date): number {
  return startOfDay(date).getTime() - startOfDay(dateToCompare).getTime();
}

export function compareTimestamps(date: Date, dateToCompare: Date): number {
  return date.getTime() - dateToCompare.getTime();
}
