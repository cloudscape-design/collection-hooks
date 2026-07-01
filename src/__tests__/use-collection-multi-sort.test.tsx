// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
import * as React from 'react';
import { test, expect, vi } from 'vitest';
import { act, render } from '@testing-library/react';

import { useCollection } from '../';
import { SortingState, UseCollectionResult } from '../interfaces';
import * as logging from '../logging';

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

const defaultSortingColumns: ReadonlyArray<SortingState<Row>> = [
  { sortingColumn: { sortingField: 'group' }, isDescending: false },
  { sortingColumn: { sortingField: 'n' }, isDescending: true },
];

// Renders the hook and exposes its latest result via a mutable capture object.
function renderCollection(capture: { current: UseCollectionResult<Row> | null }) {
  function App() {
    const result = useCollection(items, {
      sorting: { multiColumn: true, defaultSortingColumns },
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
  expect(props.multiColumnSort!.sortingColumns).toEqual(defaultSortingColumns);
  expect(props.sortingColumn).toBeUndefined();
  expect(props.sortingDescending).toBeUndefined();
});

test('sorts items by the multi-column default state', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  const { getByTestId } = renderCollection(capture);
  expect(getByTestId('order').textContent).toBe('a2,a1,b2,b1');
});

test('single-column defaultState is unchanged and drives the single-sort props and item order', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    const result = useCollection(items, {
      sorting: { defaultState: { sortingColumn: { sortingField: 'n' }, isDescending: true } },
    });
    capture.current = result;
    return null;
  }
  render(<App />);

  const props = capture.current!.collectionProps;
  expect(props.sortingColumn).toEqual({ sortingField: 'n' });
  expect(props.sortingDescending).toBe(true);
  expect(props.multiColumnSort).toBeUndefined();
  // Backwards-compat is behavioral: the legacy single default actually reorders items (n desc).
  expect(capture.current!.items.map(i => i.n)).toEqual([2, 2, 1, 1]);
});

test('multiColumnSort.onChange updates the sort order and resets to page 1', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  // 4 items with pageSize 2 -> 2 pages; start on page 2 so the reset to page 1 is actually observable.
  function App() {
    const result = useCollection(items, {
      sorting: { multiColumn: true, defaultSortingColumns },
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

test('multiColumn with no default initializes to an empty sort', () => {
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

test('warns and ignores defaultState (single) when multiColumn is enabled', () => {
  const warnOnce = vi.spyOn(logging, 'warnOnce').mockImplementation(() => {});
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    capture.current = useCollection(items, {
      sorting: { multiColumn: true, defaultState: { sortingColumn: { sortingField: 'n' }, isDescending: true } },
    });
    return null;
  }
  render(<App />);

  expect(warnOnce).toHaveBeenCalledWith(expect.stringContaining('Use `sorting.defaultSortingColumns`'));
  // defaultState is ignored in multiColumn mode; sorting starts empty.
  expect(capture.current!.collectionProps.multiColumnSort!.sortingColumns).toEqual([]);
  warnOnce.mockRestore();
});

test('multiColumn prefers defaultSortingColumns over defaultState without warning when both are set', () => {
  const warnOnce = vi.spyOn(logging, 'warnOnce').mockImplementation(() => {});
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    capture.current = useCollection(items, {
      sorting: {
        multiColumn: true,
        defaultState: { sortingColumn: { sortingField: 'n' }, isDescending: true },
        defaultSortingColumns,
      },
    });
    return null;
  }
  render(<App />);

  // defaultSortingColumns wins; the single defaultState is silently ignored (mode-appropriate, no warning).
  expect(capture.current!.collectionProps.multiColumnSort!.sortingColumns).toEqual(defaultSortingColumns);
  expect(warnOnce).not.toHaveBeenCalled();
  warnOnce.mockRestore();
});

test('warns and ignores defaultSortingColumns when multiColumn is not enabled', () => {
  const warnOnce = vi.spyOn(logging, 'warnOnce').mockImplementation(() => {});
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    capture.current = useCollection(items, {
      sorting: { defaultSortingColumns: [{ sortingColumn: { sortingField: 'n' }, isDescending: true }] },
    });
    return null;
  }
  render(<App />);

  expect(warnOnce).toHaveBeenCalledWith(expect.stringContaining('is ignored unless `sorting.multiColumn` is enabled'));
  // Ignored -> no default sort applied via the single-sort props.
  expect(capture.current!.collectionProps.sortingColumn).toBeUndefined();
  expect(capture.current!.collectionProps.sortingDescending).toBeUndefined();
  warnOnce.mockRestore();
});

test('single mode with both fields set: defaultState drives the sort, defaultSortingColumns is ignored', () => {
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    capture.current = useCollection(items, {
      sorting: {
        defaultState: { sortingColumn: { sortingField: 'n' }, isDescending: true },
        defaultSortingColumns: [{ sortingColumn: { sortingField: 'group' }, isDescending: false }],
      },
    });
    return null;
  }
  render(<App />);

  // defaultState still drives single-column sort despite the ignored array (warning asserted separately above).
  expect(capture.current!.collectionProps.sortingColumn).toEqual({ sortingField: 'n' });
  expect(capture.current!.collectionProps.sortingDescending).toBe(true);
  expect(capture.current!.collectionProps.multiColumnSort).toBeUndefined();
});

test('single mode with an empty sorting object starts unsorted and does not warn', () => {
  const warnOnce = vi.spyOn(logging, 'warnOnce').mockImplementation(() => {});
  const capture: { current: UseCollectionResult<Row> | null } = { current: null };
  function App() {
    capture.current = useCollection(items, { sorting: {} });
    return null;
  }
  render(<App />);

  const props = capture.current!.collectionProps;
  expect(props.sortingColumn).toBeUndefined();
  expect(props.sortingDescending).toBeUndefined();
  expect(props.multiColumnSort).toBeUndefined();
  expect(capture.current!.items).toEqual(items);
  expect(warnOnce).not.toHaveBeenCalled();
  warnOnce.mockRestore();
});
