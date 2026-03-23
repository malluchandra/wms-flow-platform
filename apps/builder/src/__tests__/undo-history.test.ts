import { describe, it, expect } from 'vitest';
import { createUndoHistory } from '../lib/use-undo-history';

describe('createUndoHistory', () => {
  it('initializes with the given state', () => {
    const history = createUndoHistory({ count: 0 });
    expect(history.current()).toEqual({ count: 0 });
    expect(history.canUndo()).toBe(false);
    expect(history.canRedo()).toBe(false);
  });

  it('push adds state and enables undo', () => {
    const history = createUndoHistory({ count: 0 });
    history.push({ count: 1 });
    expect(history.current()).toEqual({ count: 1 });
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(false);
  });

  it('undo restores previous state', () => {
    const history = createUndoHistory({ count: 0 });
    history.push({ count: 1 });
    history.push({ count: 2 });
    const prev = history.undo();
    expect(prev).toEqual({ count: 1 });
    expect(history.current()).toEqual({ count: 1 });
    expect(history.canUndo()).toBe(true);
    expect(history.canRedo()).toBe(true);
  });

  it('redo restores next state after undo', () => {
    const history = createUndoHistory({ count: 0 });
    history.push({ count: 1 });
    history.push({ count: 2 });
    history.undo();
    const next = history.redo();
    expect(next).toEqual({ count: 2 });
    expect(history.current()).toEqual({ count: 2 });
    expect(history.canRedo()).toBe(false);
  });

  it('push after undo clears redo stack', () => {
    const history = createUndoHistory({ count: 0 });
    history.push({ count: 1 });
    history.push({ count: 2 });
    history.undo();
    history.push({ count: 3 });
    expect(history.current()).toEqual({ count: 3 });
    expect(history.canRedo()).toBe(false);
    expect(history.canUndo()).toBe(true);
  });

  it('undo returns undefined when nothing to undo', () => {
    const history = createUndoHistory({ count: 0 });
    expect(history.undo()).toBeUndefined();
    expect(history.current()).toEqual({ count: 0 });
  });

  it('redo returns undefined when nothing to redo', () => {
    const history = createUndoHistory({ count: 0 });
    expect(history.redo()).toBeUndefined();
  });

  it('respects max history limit', () => {
    const history = createUndoHistory(0, { maxSize: 3 });
    history.push(1);
    history.push(2);
    history.push(3);
    history.push(4);
    expect(history.current()).toBe(4);
    history.undo(); // 3
    history.undo(); // 2
    history.undo(); // 1
    expect(history.undo()).toBeUndefined();
    expect(history.current()).toBe(1);
  });
});
