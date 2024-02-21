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

test('creates default expanded items state with expandableItems.defaultExpandedItems', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      pagination: {},
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

test('expandable items state is changed with collectionProps.onExpandChange', () => {
  const allItems = generateItems(50);
  function App() {
    const result = useCollection(allItems, {
      pagination: { pageSize: 25 },
      expandableRows: { getId, getParentId },
    });
    return (
      <div>
        <Demo {...result} />
        <button
          data-testid="expand-one"
          onClick={() =>
            result.collectionProps.onExpandableItemToggle?.({ detail: { item: allItems[1], expanded: true } })
          }
        ></button>
      </div>
    );
  }
  const { queries, getExpandedItems } = render(<App />);

  fireEvent.click(queries.getByTestId('expand-one'));

  expect(getExpandedItems()).toEqual(['2']);
});

test('expanded items is used to hide items with non-expanded parents', () => {
  const allItems = generateItems(25);
  function App() {
    const result = useCollection(allItems, {
      pagination: { pageSize: 10 },
      expandableRows: {
        getId,
        getParentId: item => {
          if (allItems.indexOf(item) > 0 && allItems.indexOf(item) < 4) {
            return allItems[0].id;
          }
          if (allItems.indexOf(item) > 4 && allItems.indexOf(item) < 9) {
            return allItems[4].id;
          }
          if (allItems.indexOf(item) > 9 && allItems.indexOf(item) < 14) {
            return allItems[9].id;
          }
          if (allItems.indexOf(item) > 14 && allItems.indexOf(item) < 19) {
            return allItems[14].id;
          }
          if (allItems.indexOf(item) > 19 && allItems.indexOf(item) < 24) {
            return allItems[19].id;
          }
          return null;
        },
        defaultExpandedItems: [allItems[14]],
      },
    });
    return <Demo {...result} />;
  }
  const { getVisibleItems } = render(<App />);

  expect(getVisibleItems()).toEqual(['1', '5', '10', '15', '16', '17', '18', '19', '20', '25']);
});

test('expanded items is used to hide items with non-expanded grandparents', () => {
  const allItems = [
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
  function App() {
    const result = useCollection(allItems, {
      pagination: { pageSize: 10 },
      expandableRows: {
        getId,
        getParentId: item => allItems.find(maybeParent => item.id.slice(0, -2) === maybeParent.id)?.id ?? null,
        defaultExpandedItems: [allItems[0], allItems[1], allItems[4]],
      },
    });
    return <Demo {...result} />;
  }

  const { getVisibleItems: getVisibleItems } = render(<App />);
  expect(getVisibleItems()).toEqual(['a', 'a.1', 'a.1.1', 'a.1.2', 'b', 'b.1', 'c']);
});

test('expanded items state is updated to remove no-longer present items', () => {
  const allItems = [{ id: 'a' }, { id: 'b' }, { id: 'c' }, { id: 'd' }, { id: 'e' }, { id: 'f' }];
  function App({ items }: { items: Item[] }) {
    const result = useCollection(items, {
      pagination: { pageSize: 10 },
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
