import { useState, useCallback, useRef } from 'react';

// ─── Pure logic (testable without React) ──────────────────────

interface UndoHistoryOptions {
  maxSize?: number;
}

interface UndoHistoryAPI<T> {
  current: () => T;
  push: (state: T) => void;
  undo: () => T | undefined;
  redo: () => T | undefined;
  canUndo: () => boolean;
  canRedo: () => boolean;
  undoCount: () => number;
  redoCount: () => number;
}

export function createUndoHistory<T>(
  initial: T,
  opts: UndoHistoryOptions = {}
): UndoHistoryAPI<T> {
  const maxSize = opts.maxSize ?? 50;
  const past: T[] = [];
  const future: T[] = [];
  let present: T = initial;

  return {
    current: () => present,
    push: (state: T) => {
      past.push(present);
      if (past.length > maxSize) {
        past.shift();
      }
      present = state;
      future.length = 0;
    },
    undo: () => {
      if (past.length === 0) return undefined;
      future.push(present);
      present = past.pop()!;
      return present;
    },
    redo: () => {
      if (future.length === 0) return undefined;
      past.push(present);
      present = future.pop()!;
      return present;
    },
    canUndo: () => past.length > 0,
    canRedo: () => future.length > 0,
    undoCount: () => past.length,
    redoCount: () => future.length,
  };
}

// ─── React hook wrapper ───────────────────────────────────────

interface UseUndoHistoryReturn<T> {
  state: T;
  setState: (newState: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  undoCount: number;
  redoCount: number;
}

export function useUndoHistory<T>(initial: T): UseUndoHistoryReturn<T> {
  const historyRef = useRef(createUndoHistory(initial));
  const [state, setReactState] = useState(initial);

  const setState = useCallback((newState: T) => {
    historyRef.current.push(newState);
    setReactState(newState);
  }, []);

  const undo = useCallback(() => {
    const prev = historyRef.current.undo();
    if (prev !== undefined) {
      setReactState(prev);
    }
  }, []);

  const redo = useCallback(() => {
    const next = historyRef.current.redo();
    if (next !== undefined) {
      setReactState(next);
    }
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: historyRef.current.canUndo(),
    canRedo: historyRef.current.canRedo(),
    undoCount: historyRef.current.undoCount(),
    redoCount: historyRef.current.redoCount(),
  };
}
