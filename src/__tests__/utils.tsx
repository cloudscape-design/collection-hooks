// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { useCollection, UseCollectionOptions, UseCollectionResult } from '..';
import { render } from '@testing-library/react';
import { getTrackableValue } from '../operations/trackby-utils.js';

export function renderUseCollection<T>(allItems: readonly T[], options: UseCollectionOptions<T>) {
  const result: {
    collection: UseCollectionResult<T>;
    rerender: (allItems: readonly T[], options: UseCollectionOptions<T>) => void;
    // Derived props for simpler assertions
    visibleItems: T[];
  } = {} as any;

  const onResult = (collection: UseCollectionResult<T>) => {
    result.collection = collection;
    result.visibleItems = getVisibleItems(collection);
  };
  const { rerender } = render(<App allItems={allItems} options={options} onResult={onResult} />);

  result.rerender = (allItems: readonly T[], options: UseCollectionOptions<T>) =>
    rerender(<App allItems={allItems} options={options} onResult={onResult} />);

  return result;
}

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
