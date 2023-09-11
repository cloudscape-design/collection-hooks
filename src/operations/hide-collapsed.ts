// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { getTrackableValue } from './index';
import { ExpandableItemsOptions } from '../interfaces';

export function hideCollapsed<T>(
  items: ReadonlyArray<T>,
  expandedItems: ReadonlyArray<T>,
  expandableItems: ExpandableItemsOptions<T>
): ReadonlyArray<T> {
  const trackBy = expandableItems.trackBy;
  const getItemKey = (item: T) => (trackBy ? getTrackableValue(trackBy, item) : item);
  const existingKeys = new Set(expandedItems.map(getItemKey));

  return items.filter(item => {
    let parent = expandableItems.getParent(item);
    while (parent !== null) {
      if (!existingKeys.has(getItemKey(parent))) {
        return false;
      }
      parent = expandableItems.getParent(parent);
    }
    return true;
  });
}
