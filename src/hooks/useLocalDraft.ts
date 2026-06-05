import { useCallback, useState } from 'react';

/**
 * Form-draft persistence backed by localStorage. Drop-in replacement for
 * useState wherever the value is something the user typed and would lose
 * progress on if the page unloaded (iOS PWA freeze, accidental refresh,
 * tab switch coming back to a reloaded view).
 *
 * Each draft is scoped by a string key and TTL'd at 24h so abandoned
 * drafts get garbage-collected automatically.
 *
 * Returned tuple is (value, setValue, clear) — clear() removes the
 * stored entry, typically called when the form submits successfully so
 * the next "new" form starts blank.
 */
const DRAFT_TTL_MS = 24 * 60 * 60 * 1000;
const STORAGE_PREFIX = 'anfcrm.draft.';

interface StoredDraft<T> { v: T; t: number }

function readDraft<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as StoredDraft<T>;
    if (!parsed || typeof parsed.t !== 'number') return fallback;
    if (Date.now() - parsed.t > DRAFT_TTL_MS) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return fallback;
    }
    return parsed.v;
  } catch {
    return fallback;
  }
}

function writeDraft<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + key,
      JSON.stringify({ v: value, t: Date.now() }),
    );
  } catch {
    // quota exceeded etc — silently drop, the draft just won't persist this round
  }
}

function removeDraft(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_PREFIX + key);
  } catch {
    // ignore
  }
}

export function useLocalDraft<T>(
  key: string,
  defaultValue: T,
): [T, (next: T | ((prev: T) => T)) => void, () => void] {
  const [value, setValue] = useState<T>(() => readDraft(key, defaultValue));

  // Mirror useState's signature so callers can pass either a value or
  // a functional updater (e.g. setForm((f) => ({ ...f, name: 'x' }))).
  const update = useCallback(
    (next: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
        writeDraft(key, resolved);
        return resolved;
      });
    },
    [key],
  );

  const clear = useCallback(() => {
    removeDraft(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, update, clear];
}

/**
 * Clear several drafts at once. Pass the same key strings you used with
 * useLocalDraft. Useful after a successful form submission to wipe every
 * field for that form in one call.
 */
export function clearLocalDrafts(...keys: string[]): void {
  for (const k of keys) removeDraft(k);
}
