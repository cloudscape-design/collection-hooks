// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { TreeProps } from '../interfaces';

interface TreeNode<T> {
  item: T;
  level: number;
  expanded: boolean;
  children: TreeNode<T>[];
}

interface NullableNode<T> {
  item: null | T;
  level: number;
  expanded: boolean;
  children: TreeNode<T>[];
}

interface TreeStruct<T> {
  roots: TreeNode<T>[];
  idToNode: Map<string, NullableNode<T>>;
  hasNesting: boolean;
}

export class ItemsTree<T> {
  private items: ReadonlyArray<T>;
  private treeProps?: TreeProps<T>;
  private tree: null | TreeStruct<T> = null;

  constructor(items: ReadonlyArray<T>, expandedItems: ReadonlySet<string>, treeProps?: TreeProps<T>) {
    this.items = items;
    this.treeProps = treeProps;

    if (treeProps) {
      const tree = createTree(items, expandedItems, treeProps);
      if (tree.hasNesting) {
        this.tree = tree;
      }
    }
  }

  filter(predicate: (item: T) => boolean): ItemsTree<T> {
    if (!this.tree) {
      this.items = this.items.filter(predicate);
    } else {
      filterTree(this.tree, predicate);
    }
    return this;
  }

  sort(comparator: (a: T, b: T) => number): ItemsTree<T> {
    if (!this.tree) {
      this.items = this.items.slice().sort(comparator);
    } else {
      sortTree(this.tree, comparator);
    }
    return this;
  }

  hasChildren(item: T): boolean {
    if (this.treeProps && this.tree) {
      const itemId = this.treeProps.getId(item);
      const node = this.tree.idToNode.get(itemId);
      return node ? node.children.length > 0 : false;
    }
    return false;
  }

  getChildren(item: T): T[] {
    if (this.treeProps && this.tree) {
      const itemId = this.treeProps.getId(item);
      const node = this.tree.idToNode.get(itemId);
      return node ? node.children.map(c => c.item) : [];
    }
    return [];
  }

  getLevel(item: T): number {
    if (this.treeProps && this.tree) {
      const itemId = this.treeProps.getId(item);
      const node = this.tree.idToNode.get(itemId);
      return node ? node.level : 1;
    }
    return 1;
  }

  toItems(): ReadonlyArray<T> {
    if (this.treeProps && this.tree) {
      return this.treeProps.alternativeAPI ? this.tree.roots.map(n => n.item) : flattenTree(this.tree);
    }
    return this.items;
  }
}

function createTree<T>(
  items: ReadonlyArray<T>,
  expandedItems: ReadonlySet<string>,
  treeProps: TreeProps<T>
): TreeStruct<T> {
  const roots = new Array<TreeNode<T>>();
  const idToNode = new Map<string, NullableNode<T>>();
  let hasNesting = false;

  // Create tree
  for (const item of items) {
    const itemId = treeProps.getId(item);
    const parentId = treeProps.getParentId(item);

    const nullableItemNode: NullableNode<T> = idToNode.get(itemId) ?? {
      item,
      level: 0,
      expanded: expandedItems.has(itemId),
      children: [],
    };
    const itemNode: TreeNode<T> = { ...nullableItemNode, item };

    if (parentId !== null) {
      const parent: NullableNode<T> = idToNode.get(parentId) ?? {
        item: null,
        level: 0,
        expanded: expandedItems.has(parentId),
        children: [],
      };
      parent.children.push(itemNode);
      idToNode.set(parentId, parent);
      hasNesting = true;
    } else {
      roots.push(itemNode);
    }
    idToNode.set(itemId, itemNode);
  }

  // Assign levels
  function traverse(node: TreeNode<T>, level = 1) {
    node.level = level;
    for (const child of node.children) {
      traverse(child, level + 1);
    }
  }
  roots.forEach(root => traverse(root));

  return { roots, idToNode, hasNesting };
}

function filterTree<T>(tree: TreeStruct<T>, predicate: (item: T) => boolean): void {
  function filterNode(node: TreeNode<T>) {
    node.children = node.children.filter(filterNode);
    return predicate(node.item) || node.children.length > 0;
  }
  tree.roots = tree.roots.filter(filterNode);
}

function sortTree<T>(tree: TreeStruct<T>, comparator: (a: T, b: T) => number): void {
  function sortLevel(nodes: TreeNode<T>[]) {
    nodes.sort((a, b) => comparator(a.item, b.item));
    for (const node of nodes) {
      sortLevel(node.children);
    }
  }
  sortLevel(tree.roots);
}

function flattenTree<T>(tree: TreeStruct<T>): ReadonlyArray<T> {
  const items = new Array<T>();

  function traverse(node: TreeNode<T>) {
    items.push(node.item);
    if (node.expanded) {
      node.children.forEach(traverse);
    }
  }
  tree.roots.forEach(traverse);

  return items;
}
