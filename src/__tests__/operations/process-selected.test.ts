// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { test, expect, describe } from 'vitest';
import { processSelectedItems } from '../../operations';
import { TrackBy } from '../../interfaces';

interface Item {
  id: number;
}

describe.each<[string, TrackBy<Item> | undefined]>([
  ['function', item => item.id + ''],
  ['property name', 'id'],
  ['not specified', undefined],
])('processSelectedItems with %s trackBy', (_, trackBy) => {
  test('filters out selected items, that are not in items array', () => {
    const items = [{ id: 1 }, { id: 3 }, { id: 2 }, { id: 4 }];
    const selectedItems = [items[0], { id: 5 }];
    const newSelectedItems = processSelectedItems(items, selectedItems, trackBy);
    expect(newSelectedItems).toEqual([items[0]]);
  });
});
