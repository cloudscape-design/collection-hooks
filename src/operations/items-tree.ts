// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TreeProps } from '../interfaces';

export class ItemsTree<T> {
  private items: ReadonlyArray<T>;
  private hasNesting = false;
  private roots = new Array<T>();
  private idToItem = new Map<string, T>();
  private itemToChildren = new Map<T, Array<T>>();
  private itemToLevel = new Map<T, number>();

  constructor(items: ReadonlyArray<T>, expandedItems: ReadonlySet<string>, treeProps?: TreeProps<T>) {
    this.items = items;

    if (!treeProps) {
      return;
    }

    // Assign item children.
    for (const item of items) {
      const itemId = treeProps.getId(item);
      const parentId = treeProps.getParentId(item);

      this.idToItem.set(itemId, item);

      if (parentId === null) {
        this.roots.push(item);
      } else {
        const children = this.itemToChildren.get(item) ?? [];
        children.push(item);
        this.itemToChildren.set(item, children);
        this.hasNesting = true;
      }
    }

    // Assign item levels.
    const traverse = (item: T, level = 1) => {
      this.itemToLevel.set(item, level);
      for (const child of this.itemToChildren.get(item) ?? []) {
        traverse(child, level + 1);
      }
    };
    this.roots.forEach(root => traverse(root));
  }

  filter = (predicate: (item: T) => boolean): ItemsTree<T> => {
    if (!this.hasNesting) {
      this.items = this.items.filter(predicate);
    } else {
      this.filterTree(predicate);
    }
    return this;
  };

  sort = (comparator: (a: T, b: T) => number): ItemsTree<T> => {
    if (!this.hasNesting) {
      this.items = this.items.slice().sort(comparator);
    } else {
      this.sortTree(comparator);
    }
    return this;
  };

  getChildren = (item: T): T[] => {
    return this.itemToChildren.get(item) ?? [];
  };

  getItems = (): ReadonlyArray<T> => {
    if (this.hasNesting) {
      return this.roots;
    }
    return this.items;
  };

  private filterTree = (predicate: (item: T) => boolean): void => {
    const filterNode = (item: T): boolean => {
      const children = this.getChildren(item).filter(filterNode);
      this.itemToChildren.set(item, children);
      return predicate(item) || children.length > 0;
    };
    this.roots = this.roots.filter(filterNode);
  };

  private sortTree = (comparator: (a: T, b: T) => number): void => {
    const sortLevel = (items: T[]) => {
      items.sort(comparator);
      for (const item of items) {
        sortLevel(this.getChildren(item));
      }
    };
    sortLevel(this.roots);
  };
}
