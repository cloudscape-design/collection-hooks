// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { Operator } from './interfaces';
import { parseDateToken, parseDateValue } from './operations/date-utils';

/**
 * Evaluates date property token on the given value.
 * @param value Property value that can be of type Date or ISO8601 date string.
 * @param tokenValue Filter value that can be ISO8601 date string or stringified date-range picker value.
 * @param tokenOperator Filter operator.
 * @returns true if value matches and false if it does not or if the value or token format is invalid.
 */
export function filteringFunctionDate(value: any, tokenValue: string, tokenOperator: Operator): boolean {
  const date = parseDateValue(value);
  const applyFilter = parseDateToken(tokenValue, tokenOperator);
  return date ? applyFilter(date) : false;
}
