// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { createExpandableRowsFromTree } from '../create-expandable-rows';
import { ItemsTreeNode } from '../interfaces';

interface Item {
  id: string;
}

test('works with empty collection', () => {
  const trackBy = jest.fn();
  const defaultExpanded = [{ id: 'a' }];
  const expandableRows = createExpandableRowsFromTree<Item>([], { defaultExpanded, trackBy });

  expect(expandableRows.getParent(defaultExpanded[0]));
  expect(expandableRows.defaultExpanded).toEqual(defaultExpanded);
  expect(expandableRows.trackBy).toEqual(trackBy);
  expect(trackBy).toHaveBeenCalledTimes(1);
  expect(trackBy).toHaveBeenCalledWith(defaultExpanded[0]);
});

test('creates deep parent-child associations using item references', () => {
  const itemsTree: ItemsTreeNode<Item>[] = [
    {
      item: { id: 'a' },
      children: [
        { item: { id: 'a.1' }, children: [] },
        { item: { id: 'a.2' }, children: [] },
      ],
    },
    {
      item: { id: 'b' },
      children: [
        { item: { id: 'b.1' }, children: [] },
        { item: { id: 'b.2' }, children: [{ item: { id: 'b.2.1' }, children: [] }] },
      ],
    },
  ];
  const expandableRows = createExpandableRowsFromTree<Item>(itemsTree);

  expect(expandableRows.getParent(itemsTree[0].item)).toBe(null);
  expect(expandableRows.getParent(itemsTree[0].children[0].item)).toBe(itemsTree[0].item);
  expect(expandableRows.getParent(itemsTree[0].children[1].item)).toBe(itemsTree[0].item);

  expect(expandableRows.getParent(itemsTree[1].item)).toBe(null);
  expect(expandableRows.getParent(itemsTree[1].children[0].item)).toBe(itemsTree[1].item);
  expect(expandableRows.getParent(itemsTree[1].children[1].item)).toBe(itemsTree[1].item);
  expect(expandableRows.getParent(itemsTree[1].children[1].children[0].item)).toBe(itemsTree[1].children[1].item);
});

test('creates deep parent-child associations using track IDs', () => {
  const itemsTree: ItemsTreeNode<Item>[] = [
    {
      item: { id: 'a' },
      children: [
        { item: { id: 'a.1' }, children: [] },
        { item: { id: 'a.2' }, children: [] },
      ],
    },
    {
      item: { id: 'b' },
      children: [
        { item: { id: 'b.1' }, children: [] },
        { item: { id: 'b.2' }, children: [{ item: { id: 'b.2.1' }, children: [] }] },
      ],
    },
  ];
  const expandableRows = createExpandableRowsFromTree<Item>(itemsTree, { trackBy: item => item.id });

  expect(expandableRows.getParent({ id: 'a' })).toBe(null);
  expect(expandableRows.getParent({ id: 'a.1' })).toBe(itemsTree[0].item);
  expect(expandableRows.getParent({ id: 'a.2' })).toBe(itemsTree[0].item);

  expect(expandableRows.getParent({ id: 'b' })).toBe(null);
  expect(expandableRows.getParent({ id: 'b.1' })).toBe(itemsTree[1].item);
  expect(expandableRows.getParent({ id: 'b.2' })).toBe(itemsTree[1].item);
  expect(expandableRows.getParent({ id: 'b.2.1' })).toBe(itemsTree[1].children[1].item);
});
