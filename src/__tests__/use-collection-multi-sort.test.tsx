// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as React from 'react';
import { test, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';

import { useCollection } from '../';
import { SortingState, UseCollectionOptions, UseCollectionResult } from '../interfaces';

interface Row {
  group: string;
  n: number;
}

const items: Row[] = [
  { group: 'b', n: 1 },
  { group: 'a', n: 2 },
  { group: 'a', n: 1 },
  { group: 'b', n: 2 },
];

const defaultState: ReadonlyArray<SortingState<Row>> = [
  { sortingColumn: { sortingField: 'group' }, isDescending: false },
  { sortingColumn: { sortingField: 'n' }, isDescending: true },
];

// Renders the hook and exposes its latest result via a mutable capture object.
function renderCollection(capture: { current: UseCollectionResult<Row> | null }) {
  function App() {
    const result = useCollection(items, {
      sorting: { multiColumn: true, defaultState },
      pagination: { pageSize: 10 },
    });
    capture.current = result;
    return <div data-testid="order">{result.items.map(i => `${i.group}${i.n}`).join(',')}</div>;
  }
  return render(<App />);
}

test('exposes multiColumnSort in collectionProps (and not the single-sort props) when multiColumn is enabled', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  renderCollection(capture);
  const props = capture.current!.collectionProps;
  expect(props.multiColumnSort).toBeDefined();
  expect(props.multiColumnSort!.sortingColumns).toEqual(defaultState);
  expect(props.sortingColumn).toBeUndefined();
  expect(props.sortingDescending).toBeUndefined();
});

test('sorts items by the multi-column default state', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  const { getByTestId } = renderCollection(capture);
  expect(getByTestId('order').textContent).toBe('a2,a1,b2,b1');
});

test('multiColumnSort.onChange updates the sort order and resets to page 1', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  // 4 items with pageSize 2 -> 2 pages; start on page 2 so the reset to page 1 is actually observable.
  function App() {
    const result = useCollection(items, {
      sorting: { multiColumn: true, defaultState },
      pagination: { pageSize: 2, defaultPage: 2 },
    });
    capture.current = result;
    return null;
  }
  render(<App />);

  expect(capture.current!.paginationProps.currentPageIndex).toBe(2);

  act(() => {
    capture.current!.collectionProps.multiColumnSort!.onChange({
      detail: { sortingColumns: [{ sortingColumn: { sortingField: 'n' }, isDescending: false }] },
    });
  });

  expect(capture.current!.collectionProps.multiColumnSort!.sortingColumns).toEqual([
    { sortingColumn: { sortingField: 'n' }, isDescending: false },
  ]);
  expect(capture.current!.paginationProps.currentPageIndex).toBe(1);
});

test('multiColumn with no defaultState initializes to an empty sort', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    const result = useCollection(items, { sorting: { multiColumn: true } });
    capture.current = result;
    return null;
  }
  render(<App />);

  expect(capture.current!.collectionProps.multiColumnSort!.sortingColumns).toEqual([]);
  // No default sort -> items keep their original order.
  expect(capture.current!.items).toEqual(items);
});

test('warns and recovers when defaultState is a single object while multiColumn is enabled', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  // Simulates an untyped (JS) consumer passing the single-sort shape in multi-column mode.
  const sorting = {
    multiColumn: true,
    defaultState: { sortingColumn: { sortingField: 'n' }, isDescending: true },
  } as unknown as UseCollectionOptions<Row>['sorting'];
  function App() {
    capture.current = useCollection(items, { sorting });
    return null;
  }
  render(<App />);

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('must be an array of sorting states'));
  // Recovered by wrapping the single descriptor into an array (no crash).
  expect(capture.current!.collectionProps.multiColumnSort!.sortingColumns).toEqual([
    { sortingColumn: { sortingField: 'n' }, isDescending: true },
  ]);
  warn.mockRestore();
});

test('warns when defaultState is an array while multiColumn is not enabled', () => {
  const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  // Simulates an untyped (JS) consumer passing the multi-sort shape in single-column mode.
  const sorting = {
    defaultState: [{ sortingColumn: { sortingField: 'n' }, isDescending: true }],
  } as unknown as UseCollectionOptions<Row>['sorting'];
  function App() {
    capture.current = useCollection(items, { sorting });
    return null;
  }
  render(<App />);

  expect(warn).toHaveBeenCalledWith(expect.stringContaining('must be a single sorting state'));
  // Recovered by taking the first descriptor; exposed via the single-sort props.
  expect(capture.current!.collectionProps.sortingColumn).toEqual({ sortingField: 'n' });
  expect(capture.current!.collectionProps.sortingDescending).toBe(true);
  warn.mockRestore();
});
