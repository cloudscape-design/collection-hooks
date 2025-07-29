// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe } from 'vitest';
import { encode, decode } from '../codec';
import {
  tokenGroupSimple,
  tokenGroupWithArrays,
  tokenGroupWithArraysAndDates,
  tokensSimple,
  tokensWithArrays,
  tokensWithArraysAndDates,
} from './property-filter-fixtures';

describe('codec', () => {
  test.each([
    tokenGroupSimple,
    tokenGroupWithArrays,
    tokenGroupWithArraysAndDates,
    tokensSimple,
    tokensWithArrays,
    tokensWithArraysAndDates,
  ])('encode/decode property filters', propertyFilter => {
    const encoded = encode(propertyFilter);
    const decoded = decode(encoded);
    expect(decoded).toStrictEqual(propertyFilter);
  });

  test('decode should return null if the input string is invalid json and defaultResult is not provided', () => {
    expect(decode('invalid json')).toBeNull();
  });

  test('decode should return the defaultResult if the input string is invalid json and defaultResult is provided', () => {
    const defaultResult = { operation: 'and', tokens: [], tokenGroups: [] };
    expect(decode('invalid json', defaultResult)).toStrictEqual(defaultResult);
  });
});
