// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import { fireEvent, screen } from '@testing-library/react';
import React from 'react';
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

  const { getVisibleItems } = render(<App />);
  expect(getVisibleItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b', 'b.1', 'c']);
});

test('updates expanded items when collectionProps.onExpandableItemToggle is called', () => {
  function App() {
    const result = useCollection(treeItems, {
      expandableRows: { getId, getParentId: getTreeParentId },
    });
    return (
      <>
        <Demo {...result} />
        <button
          data-testid="expand-0"
          onClick={() =>
            result.collectionProps.expandableRows?.onExpandableItemToggle({
              detail: { item: treeItems[0], expanded: true },
            })
          }
        />
      </>
    );
  }
  const { getExpandedItems, findExpandToggle } = render(<App />);

  expect(getExpandedItems()).toEqual([]);

  fireEvent.click(findExpandToggle(1)!);
  expect(getExpandedItems()).toEqual(['5']);

  fireEvent.click(findExpandToggle(1)!);
  expect(getExpandedItems()).toEqual([]);

  // Ensuring expanded items has no duplicates.
  fireEvent.click(screen.getByTestId('expand-0'));
  fireEvent.click(screen.getByTestId('expand-0'));
  expect(getExpandedItems()).toEqual(['1']);
});

test('updates expanded items with actions', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
  function App() {
    const result = useCollection(allItems, {
      expandableRows: { getId, getParentId },
    });
    const { setExpandedItems } = result.actions;
    return (
      <div>
        <Demo {...result} />
        <button data-testid="expand-all" onClick={() => setExpandedItems(allItems)}></button>
        <button data-testid="collapse-all" onClick={() => setExpandedItems([])}></button>
      </div>
    );
  }

  const { getExpandedItems } = render(<App />);
  expect(getExpandedItems()).toEqual([]);

  fireEvent.click(screen.getByTestId('expand-all'));
  expect(getExpandedItems()).toEqual(['a', 'b', 'c']);

  fireEvent.click(screen.getByTestId('collapse-all'));
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
  const deepTreeItemsWithValues: (Item & { value?: string })[] = deepTreeItems.map(item => ({ ...item }));
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

test('expanded rows with property filtering', () => {
  const deepTreeItemsWithValues: (Item & { value?: string })[] = deepTreeItems.map(item => ({ ...item }));
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

  const { getVisibleItems } = render(<App />);
  expect(getVisibleItems()).toEqual(deepTreeItems.map(item => item.id));
});

test.each([false, true])('expanded rows with selection and keepSelection=%s', keepSelection => {
  const items = [...deepTreeItems];

  function App({ items }: { items: Item[] }) {
    const result = useCollection(items, {
      expandableRows: {
        getId,
        getParentId: getDeepTreeParentId,
        defaultExpandedItems: [deepTreeItems[0], deepTreeItems[1], deepTreeItems[4], deepTreeItems[5]],
      },
      selection: {
        keepSelection,
        defaultSelectedItems: [
          deepTreeItems[0],
          deepTreeItems[1],
          deepTreeItems[2],
          deepTreeItems[3],
          deepTreeItems[5],
        ],
      },
    });
    return <Demo {...result} />;
  }

  const { getSelectedItems, findMultiSelect, findExpandToggle } = render(<App items={items} />);
  expect(getSelectedItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b.1']);

  fireEvent.click(findMultiSelect(7)!);
  expect(getSelectedItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b.1', 'b.1.2']);

  fireEvent.click(findMultiSelect(1)!);
  expect(getSelectedItems()).toEqual(['a', 'a.1.1', 'a.1.2', 'b.1', 'b.1.2']);

  fireEvent.click(findExpandToggle(1)!);
  expect(getSelectedItems()).toEqual(['a', 'b.1', 'b.1.2']);

  fireEvent.click(findExpandToggle(1)!);
  expect(getSelectedItems()).toEqual(keepSelection ? ['a', 'a.1.1', 'a.1.2', 'b.1', 'b.1.2'] : ['a', 'b.1', 'b.1.2']);
});

test('trackBy is added by expandableRows', () => {
  function App() {
    const result = useCollection(treeItems, { expandableRows: { getId, getParentId } });
    return typeof result.collectionProps.trackBy === 'function' ? (
      <div>{result.collectionProps.trackBy(treeItems[1])}</div>
    ) : null;
  }
  render(<App />);

  expect(document.body.textContent).toEqual('2');
});

test('selection.trackBy overrides expandableRows.getId', () => {
  function App() {
    const result = useCollection(treeItems, {
      expandableRows: { getId, getParentId },
      selection: { trackBy: item => item.id + item.id },
    });
    return typeof result.collectionProps.trackBy === 'function' ? (
      <div>{result.collectionProps.trackBy(treeItems[1])}</div>
    ) : null;
  }
  render(<App />);

  expect(document.body.textContent).toEqual('22');
});
