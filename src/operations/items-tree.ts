// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TreeProps } from '../interfaces';

export class ItemsTree<T> {
  private size = 0;
  private items: ReadonlyArray<T>;
  private treeProps?: TreeProps<T>;
  private hasNesting = false;
  private roots = new Array<T>();
  private idToItem = new Map<string, T>();
  private idToChildren = new Map<string, Array<T>>();
  private itemToLevel = new Map<T, number>();
  public incompleteRoot = false;
  public incompleteItems = new Set<string>();

  constructor(items: ReadonlyArray<T>, treeProps?: TreeProps<T>) {
    this.size = items.length;
    this.items = items;
    this.treeProps = treeProps;

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
        const children = this.idToChildren.get(parentId) ?? [];
        children.push(item);
        this.idToChildren.set(parentId, children);
        this.hasNesting = true;
      }
    }

    // Assign item levels.
    const traverse = (item: T, level = 1) => {
      this.itemToLevel.set(item, level);
      for (const child of this.idToChildren.get(treeProps.getId(item)) ?? []) {
        traverse(child, level + 1);
      }
    };
    this.roots.forEach(root => traverse(root));
  }

  filter = (predicate: (item: T) => boolean): ItemsTree<T> => {
    if (!this.hasNesting) {
      this.items = this.items.filter(predicate);
      this.size = this.items.length;
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

  paginate = (getPageItems: (item: null | T) => number): ItemsTree<T> => {
    if (this.hasNesting) {
      this.paginateTree(getPageItems);
    }
    return this;
  };

  getChildren = (item: T): T[] => {
    if (this.treeProps) {
      return this.idToChildren.get(this.treeProps.getId(item)) ?? [];
    }
    return [];
  };

  getItems = (): ReadonlyArray<T> => {
    if (this.hasNesting) {
      return this.roots;
    }
    return this.items;
  };

  getSize = (): number => {
    return this.size;
  };

  private setChildren(item: T, children: T[]) {
    if (this.treeProps) {
      this.idToChildren.set(this.treeProps.getId(item), children);
    }
  }

  private filterTree = (predicate: (item: T) => boolean): void => {
    const filterNode = (item: T): boolean => {
      if (this.treeProps?.keepAllChildrenWhenParentMatched && predicate(item)) {
        return true;
      }
      const children = this.getChildren(item);
      const filteredChildren = children.filter(filterNode);
      this.size -= children.length - filteredChildren.length;
      this.setChildren(item, filteredChildren);
      return predicate(item) || filteredChildren.length > 0;
    };
    const roots = this.roots;
    this.roots = this.roots.filter(filterNode);
    this.size -= roots.length - this.roots.length;
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

  private paginateTree = (getPageItems: (item: null | T) => number) => {
    const paginateLevel = (items: T[], pageSize: number) => {
      const sliced = items.slice(0, pageSize);
      for (const item of items) {
        const levelItems = this.getChildren(item);
        const updatedLevel = paginateLevel(levelItems, getPageItems(item));
        this.setChildren(item, updatedLevel);
        if (updatedLevel.length < levelItems.length) {
          this.incompleteItems.add(this.treeProps?.getId(item) ?? '');
        }
      }
      return sliced;
    };
    const roots = this.roots;
    this.roots = paginateLevel(this.roots, getPageItems(null));
    if (this.roots.length < roots.length) {
      this.incompleteRoot = true;
    }
  };
}
