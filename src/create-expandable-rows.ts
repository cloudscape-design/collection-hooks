// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ExpandableRowsOptions, ItemsTreeNode, TrackBy } from './interfaces';
import { getTrackableValue } from './operations/index';

export function createExpandableRowsFromTree<ItemType>(
  items: ReadonlyArray<ItemsTreeNode<ItemType>>,
  {
    defaultExpanded = [],
    trackBy,
  }: {
    defaultExpanded?: ReadonlyArray<ItemType>;
    trackBy?: TrackBy<ItemType>;
  } = {}
): ExpandableRowsOptions<ItemType> {
  const childKeyToParent = new Map<string, ItemType>();
  const childToParent = new Map<ItemType, ItemType>();
  const setParent = (item: ItemType, parent: ItemType): void => {
    if (trackBy) {
      childKeyToParent.set(getTrackableValue(trackBy, item), parent);
    } else {
      childToParent.set(item, parent);
    }
  };
  const getParent = (item: ItemType): null | ItemType => {
    return (trackBy ? childKeyToParent.get(getTrackableValue(trackBy, item)) : childToParent.get(item)) ?? null;
  };

  function traverseItems(parent: null | ItemType, children: readonly ItemsTreeNode<ItemType>[]) {
    for (const child of children) {
      if (parent) {
        setParent(child.item, parent);
      }
      traverseItems(child.item, child.children);
    }
  }

  traverseItems(null, items);

  return { getParent, defaultExpanded, trackBy };
}
