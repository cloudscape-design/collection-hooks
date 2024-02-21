// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { fireEvent } from '@testing-library/react';
import * as React from 'react';
import { useCollection } from '..';
import { Demo, Item, render } from './stubs';

const getId = (item: Item) => item.id;
const getParentId = () => null;
const generateItems = (length: number) =>
  Array.from({ length }, (_, index) => ({ id: `${index + 1}` })) as ReadonlyArray<Item>;

const treeItems = generateItems(25);
const getTreeParentId = (item: Item) => {
  if (treeItems.indexOf(item) > 0 && treeItems.indexOf(item) < 4) {
    return treeItems[0].id;
  }
  if (treeItems.indexOf(item) > 4 && treeItems.indexOf(item) < 9) {
    return treeItems[4].id;
  }
  if (treeItems.indexOf(item) > 9 && treeItems.indexOf(item) < 14) {
    return treeItems[9].id;
  }
  if (treeItems.indexOf(item) > 14 && treeItems.indexOf(item) < 19) {
    return treeItems[14].id;
  }
  if (treeItems.indexOf(item) > 19 && treeItems.indexOf(item) < 24) {
    return treeItems[19].id;
  }
  return null;
};

const deepTreeItems = [
  { id: 'a' },
  { id: 'a.1' },
  { id: 'a.1.1' },
  { id: 'a.1.2' },
  { id: 'b' },
  { id: 'b.1' },
  { id: 'b.1.1' },
  { id: 'b.1.2' },
  { id: 'c' },
  { id: 'c.1' },
  { id: 'c.1.1' },
  { id: 'c.1.2' },
];
const getDeepTreeParentId = (item: Item) =>
  deepTreeItems.find(maybeParent => item.id.slice(0, -2) === maybeParent.id)?.id ?? null;

test('initializes expanded rows with expandableRows.defaultExpandedItems', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      expandableRows: {
        getId,
        getParentId,
        defaultExpandedItems: [allItems[0], allItems[2]],
      },
    });
    return <Demo {...result} />;
  }
  const { getExpandedItems } = render(<App />);
  const expandedItems = getExpandedItems();

  expect(expandedItems).toHaveLength(2);
  expect(expandedItems[0]).toBe('1');
  expect(expandedItems[1]).toBe('3');
});

test('displays root items and expanded items children only', () => {
  function App() {
    const result = useCollection(treeItems, {
      expandableRows: {
        getId,
        getParentId: getTreeParentId,
        defaultExpandedItems: [treeItems[14]],
      },
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems } = render(<App />);

  expect(getVisibleItems()).toEqual(['1', '5', '10', '15', '16', '17', '18', '19', '20', '25']);
});

test('displays root items and expanded items children only in a deep tree', () => {
  function App() {
    const result = useCollection(deepTreeItems, {
      expandableRows: {
        getId,
        getParentId: getDeepTreeParentId,
        defaultExpandedItems: [deepTreeItems[0], deepTreeItems[1], deepTreeItems[4]],
      },
    });
    return <Demo {...result} />;
  }

  const { getVisibleItems: getVisibleItems } = render(<App />);
  expect(getVisibleItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b', 'b.1', 'c']);
});

test('updates expanded items when collectionProps.onExpandableItemToggle is called', () => {
  function App() {
    const result = useCollection(treeItems, {
      expandableRows: { getId, getParentId: getTreeParentId },
    });
    return <Demo {...result} />;
  }
  const { getExpandedItems, findExpandToggle } = render(<App />);

  expect(getExpandedItems()).toEqual([]);

  fireEvent.click(findExpandToggle(1)!);
  expect(getExpandedItems()).toEqual(['5']);

  fireEvent.click(findExpandToggle(1)!);
  expect(getExpandedItems()).toEqual([]);
});

test('expanded items state is updated to remove no-longer present items', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }];
  function App({ items }: { items: Item[] }) {
    const result = useCollection(items, {
      expandableRows: {
        getId,
        getParentId,
        defaultExpandedItems: allItems,
      },
    });
    return <Demo {...result} />;
  }

  const { rerender, getExpandedItems } = render(<App items={allItems} />);
  expect(getExpandedItems()).toEqual(['a', 'b', 'c', 'd', 'e', 'f']);

  rerender(<App items={[allItems[0], allItems[2], allItems[3], allItems[4], allItems[5]]} />);
  expect(getExpandedItems()).toEqual(['a', 'c', 'd', 'e', 'f']);

  rerender(<App items={allItems} />);
  expect(getExpandedItems()).toEqual(['a', 'c', 'd', 'e', 'f']);
});

test('expanded rows with text filtering', () => {
  const deepTreeItemsWithValues: (Item & { value?: string })[] = [...deepTreeItems];
  deepTreeItemsWithValues.find(item => item.id === 'a.1')!.value = 'match';

  function App() {
    const result = useCollection(deepTreeItemsWithValues, {
      expandableRows: {
        getId,
        getParentId: getDeepTreeParentId,
        defaultExpandedItems: deepTreeItemsWithValues,
      },
      filtering: {
        defaultFilteringText: 'match',
      },
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems } = render(<App />);

  expect(getVisibleItems()).toEqual(['a', 'a.1']);
});

test('expanded rows with text filtering and keepAllChildrenWhenParentMatched', () => {
  const deepTreeItemsWithValues: (Item & { value?: string })[] = [...deepTreeItems];
  deepTreeItemsWithValues.find(item => item.id === 'a.1')!.value = 'match';

  function App() {
    const result = useCollection(deepTreeItemsWithValues, {
      expandableRows: {
        getId,
        getParentId: getDeepTreeParentId,
        defaultExpandedItems: deepTreeItemsWithValues,
        keepAllChildrenWhenParentMatched: true,
      },
      filtering: {
        defaultFilteringText: 'match',
      },
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems } = render(<App />);

  expect(getVisibleItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2']);
});

test('expanded rows with property filtering', () => {
  const deepTreeItemsWithValues: (Item & { value?: string })[] = [...deepTreeItems];
  deepTreeItemsWithValues.find(item => item.id === 'a.1')!.value = 'match';

  function App() {
    const result = useCollection(deepTreeItemsWithValues, {
      expandableRows: {
        getId,
        getParentId: getDeepTreeParentId,
        defaultExpandedItems: deepTreeItemsWithValues,
      },
      propertyFiltering: {
        filteringProperties: [{ key: 'value', operators: ['='], propertyLabel: '', groupValuesLabel: '' }],
        defaultQuery: { tokens: [{ propertyKey: 'value', operator: '=', value: 'match' }], operation: 'and' },
      },
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems } = render(<App />);

  expect(getVisibleItems()).toEqual(['a', 'a.1']);
});

test('expanded rows with pagination', () => {
  function App({ pageSize }: { pageSize: number }) {
    const result = useCollection(treeItems, {
      pagination: { pageSize },
      expandableRows: {
        getId,
        getParentId: getTreeParentId,
        defaultExpandedItems: treeItems,
      },
    });
    return <Demo {...result} />;
  }
  const { rerender, getVisibleItems } = render(<App pageSize={10} />);

  expect(getVisibleItems()).toEqual(treeItems.map(item => item.id));

  rerender(<App pageSize={3} />);
  expect(getVisibleItems()).toEqual(treeItems.map(item => item.id).slice(0, 14));
});

test('expanded rows with sorting', () => {
  const shuffledDeepTreeItems: Item[] = deepTreeItems
    .map(item => ({ ...item, value: Math.random() }))
    .sort((a, b) => a.value - b.value);
  function App() {
    const result = useCollection(shuffledDeepTreeItems, {
      sorting: {
        defaultState: {
          sortingColumn: {
            sortingField: 'id',
          },
        },
      },
      expandableRows: {
        getId,
        getParentId: getDeepTreeParentId,
        defaultExpandedItems: shuffledDeepTreeItems,
      },
    });
    return <Demo {...result} />;
  }

  const { getVisibleItems: getVisibleItems } = render(<App />);
  expect(getVisibleItems()).toEqual(deepTreeItems.map(item => item.id));
});
