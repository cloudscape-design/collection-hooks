// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

interface TreeProps<T> {
  getId(item: T): string;
  getParentId(item: T): null | string;
}

export function computeFlatItems<T>(
  items: readonly T[],
  filterPredicate: null | ((item: T) => boolean),
  sortingComparator: null | ((a: T, b: T) => number)
) {
  if (filterPredicate) {
    items = items.filter(filterPredicate);
  }
  if (sortingComparator) {
    items = items.slice().sort(sortingComparator);
  }
  return { items, size: items.length, getChildren: () => [] };
}

export function computeTreeItems<T>(
  allItems: readonly T[],
  treeProps: TreeProps<T>,
  filterPredicate: null | ((item: T) => boolean),
  sortingComparator: null | ((a: T, b: T) => number)
) {
  const idToChildren = new Map<string, T[]>();
  let items: T[] = [];
  let size = allItems.length;

  for (const item of allItems) {
    const parentId = treeProps.getParentId(item);
    if (parentId === null) {
      items.push(item);
    } else {
      const children = idToChildren.get(parentId) ?? [];
      children.push(item);
      idToChildren.set(parentId, children);
    }
  }
  const getChildren = (item: T) => idToChildren.get(treeProps.getId(item)) ?? [];
  const setChildren = (item: T, children: T[]) => idToChildren.set(treeProps.getId(item), children);

  if (filterPredicate) {
    const filterNode = (item: T): boolean => {
      const children = getChildren(item);
      const filteredChildren = children.filter(filterNode);
      size -= children.length - filteredChildren.length;
      setChildren(item, filteredChildren);
      return filterPredicate(item) || filteredChildren.length > 0;
    };
    const prevLength = items.length;
    items = items.filter(filterNode);
    size -= prevLength - items.length;
  }

  if (sortingComparator) {
    const sortLevel = (levelItems: T[]) => {
      levelItems.sort(sortingComparator);
      for (const item of levelItems) {
        sortLevel(getChildren(item));
      }
    };
    sortLevel(items);
  }

  return { items, size, getChildren };
}
