// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { ExpandableGroupsOptions } from '../interfaces';

export function hideCollapsed<T>(
  items: ReadonlyArray<T>,
  expandedGroups: ReadonlySet<string>,
  expandableGroups: ExpandableGroupsOptions<T>
): ReadonlyArray<T> {
  return items.filter(item => {
    let parent = expandableGroups.getParentGroup(item);
    while (parent !== null) {
      if (!expandedGroups.has(expandableGroups.getGroupKey(parent))) {
        return false;
      }
      parent = expandableGroups.getParentGroup(parent);
    }
    return true;
  });
}
