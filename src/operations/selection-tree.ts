// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import { GroupSelectionState, TrackBy } from '../interfaces';
import { getTrackableValue } from './trackby-utils.js';

const ROOT_KEY = Symbol('selection-tree-root');

type ItemKey = unknown;

interface SelectionTreeProps<T> {
  getChildren(item: T): readonly T[];
  trackBy?: TrackBy<T>;
}

export class SelectionTree<T> {
  private roots: readonly T[];
  private treeProps: SelectionTreeProps<T>;
  private itemKeyToItem = new Map<ItemKey, T>();
  private itemSelectionState = new Set<ItemKey>();
  private itemProjectedSelectionState = new Set<ItemKey>();
  private itemProjectedParentSelectionState = new Set<ItemKey>();
  private itemProjectedIndeterminateState = new Set<ItemKey>();
  private itemKeyToSelectedCount = new Map<ItemKey, number>();
  private selectedLeafItems = new Array<T>();

  constructor(roots: readonly T[], treeProps: SelectionTreeProps<T>, state: GroupSelectionState<T>) {
    this.roots = roots;
    this.treeProps = treeProps;

    // Translate initial state into internal representation.
    if (state.baseline === 'all') {
      this.itemSelectionState.add(ROOT_KEY);
    }
    for (const item of state.toggledItems) {
      this.itemSelectionState.add(this.getKey(item));
    }
    // Populate item key to item mapping.
    const traverse = (item: T) => {
      this.itemKeyToItem.set(this.getKey(item), item);
      treeProps.getChildren(item).forEach(traverse);
    };
    roots.forEach(traverse);

    this.computeState();
  }

  public isItemSelected = (item: T) => this.itemProjectedSelectionState.has(this.getKey(item));

  public isItemIndeterminate = (item: T) => this.itemProjectedIndeterminateState.has(this.getKey(item));

  public isAllItemsSelected = () =>
    this.itemProjectedSelectionState.has(ROOT_KEY) && !this.itemProjectedIndeterminateState.has(ROOT_KEY);

  public isAllItemsIndeterminate = () => this.itemProjectedIndeterminateState.has(ROOT_KEY);

  public getSelectedItemsCount = (item: T) => this.itemKeyToSelectedCount.get(this.getKey(item)) ?? 0;

  public getSelectedLeafItems = () => this.selectedLeafItems;

  // The selection state can differ from the initial one because of the applied normalization.
  public getState = (): GroupSelectionState<T> => {
    const selectionInverted = this.itemSelectionState.has(ROOT_KEY);
    const toggledItems: T[] = [];
    for (const itemKey of Array.from(this.itemSelectionState)) {
      const item = this.getItemForKey(itemKey);
      if (item) {
        toggledItems.push(item);
      }
    }
    return { baseline: selectionInverted ? 'all' : 'none', toggledItems };
  };

  public toggleAll = (): SelectionTree<T> => {
    return this.isAllItemsSelected()
      ? new SelectionTree(this.roots, this.treeProps, { baseline: 'none', toggledItems: [] })
      : new SelectionTree(this.roots, this.treeProps, { baseline: 'all', toggledItems: [] });
  };

  public invertAll = (): SelectionTree<T> => {
    const clone = this.clone();
    clone.toggleKey(ROOT_KEY);
    clone.roots.forEach(item => clone.toggleKey(clone.getKey(item)));
    clone.computeState();
    return clone;
  };

  public toggleSome = (requestedItems: readonly T[]): SelectionTree<T> => {
    const clone = this.clone();
    const lastItemKey = clone.getKey(requestedItems[requestedItems.length - 1]);
    const isParentSelected = clone.itemProjectedParentSelectionState.has(lastItemKey);
    const isSelected = clone.itemProjectedSelectionState.has(lastItemKey);
    const isIndeterminate = clone.itemProjectedIndeterminateState.has(lastItemKey);
    const nextIsSelected = !(isSelected && !isIndeterminate);
    const nextIsSelfSelected = (isParentSelected && !nextIsSelected) || (!isParentSelected && nextIsSelected);

    for (const requested of requestedItems) {
      clone.unselectDeep(requested);
      if (nextIsSelfSelected) {
        clone.itemSelectionState.add(this.getKey(requested));
      }
    }
    clone.computeState();

    return clone;
  };

  public invertOne = (item: T): SelectionTree<T> => {
    const clone = this.clone();
    clone.toggleKey(clone.getKey(item));
    clone.treeProps.getChildren(item).forEach(child => clone.toggleKey(clone.getKey(child)));
    clone.computeState();
    return clone;
  };

  private computeState() {
    this.itemProjectedSelectionState = new Set();
    this.itemProjectedIndeterminateState = new Set();
    this.itemKeyToSelectedCount = new Map();
    this.selectedLeafItems = [];

    // Transform input items tree to selection buckets.
    // Selection buckets are organized in a map by level.
    // Each bucket has a parent element (index=0) and might have children elements (index>=1).
    const selectionBuckets = new Map<number, ItemKey[][]>();
    const createSelectionBuckets = (item: T, level: number) => {
      const itemKey = this.getKey(item);
      const levelBuckets = selectionBuckets.get(level) ?? [];
      const children = this.treeProps.getChildren(item);
      const bucket: ItemKey[] = [itemKey];
      for (const child of children) {
        bucket.push(this.getKey(child));
        createSelectionBuckets(child, level + 1);
      }
      levelBuckets.push(bucket);
      selectionBuckets.set(level, levelBuckets);
    };
    // On level=0 there is a root bucket to hold the selection-inverted state.
    // On level>0 there are buckets that represent selection for every item.
    const rootBucket: ItemKey[] = [ROOT_KEY];
    for (const item of this.roots) {
      rootBucket.push(this.getKey(item));
      createSelectionBuckets(item, 1);
    }
    selectionBuckets.set(0, [rootBucket]);

    // Transform buckets map to an array of buckets where those with bigger levels come first.
    const selectionBucketEntries = Array.from(selectionBuckets.entries())
      .sort(([a], [b]) => b - a)
      .flatMap(([, v]) => v);

    // Normalize selection state.
    for (const bucket of selectionBucketEntries) {
      // Cannot normalize 1-element buckets.
      if (bucket.length === 1) {
        continue;
      }
      let selectedCount = 0;
      for (let i = bucket.length - 1; i >= 0; i--) {
        if (this.itemSelectionState.has(bucket[i])) {
          selectedCount++;
        } else {
          break;
        }
      }
      // Normalize selection state when all children are selected but the parent is not.
      if (selectedCount === bucket.length - 1 && !this.itemSelectionState.has(bucket[0])) {
        bucket.forEach(itemKey => this.itemSelectionState.delete(itemKey));
        this.itemSelectionState.add(bucket[0]);
      }
      // Normalize selection state when all children and the parent are selected.
      if (selectedCount === bucket.length) {
        bucket.forEach(itemKey => this.itemSelectionState.delete(itemKey));
      }
    }

    // Compute projected indeterminate state.
    // The parent (bucket[0]) is indeterminate when any of its children (bucket[1+]) is selected or indeterminate.
    for (const bucket of selectionBucketEntries) {
      let indeterminate = false;
      for (let i = 1; i < bucket.length; i++) {
        if (this.itemSelectionState.has(bucket[i]) || this.itemProjectedIndeterminateState.has(bucket[i])) {
          indeterminate = true;
          break;
        }
      }
      if (indeterminate) {
        this.itemProjectedIndeterminateState.add(bucket[0]);
      }
    }

    // Compute projected selected state.
    // An item is selected either when it is present in selection state but its parent is not selected,
    // or when it is not present in selection state but its parent is selected.
    // An item can be selected and indeterminate at the same time.
    const setItemProjectedSelection = (item: T, isParentSelected: boolean) => {
      const itemKey = this.getKey(item);
      const isSelfSelected = this.itemSelectionState.has(itemKey);
      const isSelected = (isSelfSelected && !isParentSelected) || (!isSelfSelected && isParentSelected);
      if (isSelected) {
        this.itemProjectedSelectionState.add(itemKey);
      }
      if (isParentSelected) {
        this.itemProjectedParentSelectionState.add(itemKey);
      }
      this.treeProps.getChildren(item).forEach(child => setItemProjectedSelection(child, isSelected));
    };
    // The projected selection computation starts from the root pseudo-item (selection inverted state).
    this.roots.forEach(item => {
      const isRootSelected = this.itemSelectionState.has(ROOT_KEY);
      if (isRootSelected) {
        this.itemProjectedSelectionState.add(ROOT_KEY);
      }
      setItemProjectedSelection(item, isRootSelected);
    });

    // Use projected selection state to compute selected children count per item.
    const computeCounts = (item: T): number => {
      const children = this.treeProps.getChildren(item);
      let count = 0;
      if (children.length > 0) {
        count = children.reduce((count, child) => count + computeCounts(child), 0);
      } else if (this.isItemSelected(item)) {
        count = 1;
        this.selectedLeafItems.push(item);
      }
      this.itemKeyToSelectedCount.set(this.getKey(item), count);
      return count;
    };
    for (const item of this.roots) {
      computeCounts(item);
    }
  }

  private getKey(item: T): ItemKey {
    return getTrackableValue(this.treeProps.trackBy, item);
  }

  private getItemForKey(itemKey: ItemKey): null | T {
    if (itemKey === ROOT_KEY) {
      return null;
    }
    return this.itemKeyToItem.get(itemKey)!;
  }

  private toggleKey = (key: ItemKey) => {
    if (this.itemSelectionState.has(key)) {
      this.itemSelectionState.delete(key);
    } else {
      this.itemSelectionState.add(key);
    }
  };

  private unselectDeep = (item: T) => {
    this.itemSelectionState.delete(this.getKey(item));
    this.treeProps.getChildren(item).forEach(child => this.unselectDeep(child));
  };

  private clone(): SelectionTree<T> {
    const clone = new SelectionTree(this.roots, this.treeProps, { baseline: 'none', toggledItems: [] });
    clone.itemKeyToItem = new Map(this.itemKeyToItem);
    clone.itemSelectionState = new Set(this.itemSelectionState);
    clone.itemProjectedSelectionState = new Set(this.itemProjectedSelectionState);
    clone.itemProjectedParentSelectionState = new Set(this.itemProjectedParentSelectionState);
    clone.itemProjectedIndeterminateState = new Set(this.itemProjectedIndeterminateState);
    clone.itemKeyToSelectedCount = new Map(this.itemKeyToSelectedCount);
    clone.selectedLeafItems = [...this.selectedLeafItems];
    return clone;
  }
}
