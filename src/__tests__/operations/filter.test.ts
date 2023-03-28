// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { processItems } from '../../operations';

test('returns all items when filtering text is empty', () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const { items: processed } = processItems(items, { filteringText: '' }, { filtering: {} });

  expect(processed).toEqual(items);
});
