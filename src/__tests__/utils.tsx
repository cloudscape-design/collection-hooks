// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useCollection, UseCollectionOptions, UseCollectionResult } from '..';
import { render } from '@testing-library/react';
import { getTrackableValue } from '@cloudscape-design/component-toolkit/internal';
import { Item } from './stubs';

export function renderUseCollection<T>(allItems: readonly T[], options: UseCollectionOptions<T>) {
  const current: {
    result: UseCollectionResult<T>;
    rerender: (allItems: readonly T[], options: UseCollectionOptions<T>) => void;
    // Derived props for simpler assertions
    visibleItems: T[];
  } = {} as any;

  const onResult = (collection: UseCollectionResult<T>) => {
    current.result = collection;
    current.visibleItems = getVisibleItems(collection);
  };
  const { rerender } = render(<App allItems={allItems} options={options} onResult={onResult} />);

  current.rerender = (allItems: readonly T[], options: UseCollectionOptions<T>) =>
    rerender(<App allItems={allItems} options={options} onResult={onResult} />);

  return current;
}

export const generateNestedItems = ({ totalItems }: { totalItems: number }) => {
  const items: Item[] = [];
  let nextIndex = 0;
  let level = 1;
  while (nextIndex < totalItems - 1) {
    for (; nextIndex < totalItems && nextIndex < nextIndex + Math.floor(Math.random() * 5); nextIndex++) {
      const levelParents = items.filter(i => i.id.split('.').length === level - 1);
      const parent = levelParents[Math.floor(Math.random() * levelParents.length)];
      items.push({ id: !parent ? `${nextIndex}` : `${parent.id}.${nextIndex}` });
    }
    level = Math.random() > 0.5 ? level + 1 : level;
  }
  return items;
};

function App<T>({
  allItems,
  options,
  onResult,
}: {
  allItems: readonly T[];
  options: UseCollectionOptions<T>;
  onResult: (result: UseCollectionResult<T>) => void;
}) {
  onResult(useCollection(allItems, options));
  return null;
}

function getVisibleItems<T>(collectionResult: UseCollectionResult<T>) {
  const {
    collectionProps: { trackBy, expandableRows: { getItemChildren = () => [], expandedItems = [] } = {} },
  } = collectionResult;
  const compareItems = (a: T, b: T) => getTrackableValue(trackBy, a) === getTrackableValue(trackBy, b);
  const isExpanded = (item: T) => expandedItems.some(expandedItem => compareItems(expandedItem, item)) ?? false;

  return collectionResult.items.reduce((acc, item) => {
    function addWithExpanded(node: T) {
      acc.push(node);
      if (isExpanded(node)) {
        for (const child of getItemChildren(node)) {
          addWithExpanded(child);
        }
      }
    }
    addWithExpanded(item);
    return acc;
  }, new Array<T>());
}
