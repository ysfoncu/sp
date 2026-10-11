import { useEffect, useSyncExternalStore } from "react";

// Blocks that are being edited tell the guard when they hold changes. Anything that would leave the page asks the
// guard first (`requestLeave`): with no changes it goes straight ahead, otherwise the leave dialog asks the user.
// It is a small module store (no provider) so the sidebar, the browser's Back button and the page can all use it.
const registry = new Map<string, { dirty: boolean; label: string }>();
let pending: { run: () => void; labels: string[] } | null = null;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

export const dirtyLabels = () => [...registry.values()].filter((e) => e.dirty).map((e) => e.label);
export const isDirty = () => dirtyLabels().length > 0;

// Runs `run` now when nothing is changed; otherwise asks first and runs it only if the user discards the changes.
// `run` must not call `requestLeave` itself.
export const requestLeave = (run: () => void) => {
  if (!isDirty()) {
    run();
    return;
  }
  if (pending) return; // one question at a time
  pending = { run, labels: dirtyLabels() };
  emit();
};

export const answerLeave = (discard: boolean) => {
  const p = pending;
  pending = null;
  if (discard && p) registry.forEach((e) => (e.dirty = false)); // what is left is thrown away with the blocks
  emit();
  if (discard && p) p.run();
};

export const usePendingLeave = () => useSyncExternalStore(subscribe, () => pending);

// A block reports whether it holds changes. A block that is open but unchanged reports false.
export const useDirtyGuard = (id: string, label: string, dirty: boolean) => {
  useEffect(() => {
    registry.set(id, { dirty, label });
  });
  useEffect(
    () => () => {
      registry.delete(id);
    },
    [id],
  );
};
