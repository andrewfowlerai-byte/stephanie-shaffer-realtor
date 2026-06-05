import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Typed URL-search-param state hooks. These exist so view-affecting state
 * (selected category, search query, active tab, modal open, etc.) survives
 * a tab freeze or full reload — iOS PWAs and aggressive desktop tab
 * suspension can unload the page and reset useState to its initial value.
 *
 * Convention: when the value equals its default, the param is REMOVED from
 * the URL so the address bar stays clean for default views.
 */

export function useStringParam(
  key: string,
  defaultValue = '',
): [string, (next: string) => void] {
  const [params, setParams] = useSearchParams();
  const value = params.get(key) ?? defaultValue;
  const setValue = useCallback(
    (next: string) => {
      const sp = new URLSearchParams(params);
      if (next && next !== defaultValue) sp.set(key, next);
      else sp.delete(key);
      setParams(sp, { replace: true });
    },
    [params, setParams, key, defaultValue],
  );
  return [value, setValue];
}

export function useEnumParam<T extends string>(
  key: string,
  allowed: readonly T[],
  defaultValue: T,
): [T, (next: T) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = (raw && (allowed as readonly string[]).includes(raw) ? raw : defaultValue) as T;
  const setValue = useCallback(
    (next: T) => {
      const sp = new URLSearchParams(params);
      if (next && next !== defaultValue) sp.set(key, next);
      else sp.delete(key);
      setParams(sp, { replace: true });
    },
    [params, setParams, key, defaultValue],
  );
  return [value, setValue];
}

export function useBoolParam(
  key: string,
  defaultValue = false,
): [boolean, (next: boolean) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const value = raw == null ? defaultValue : raw === '1' || raw === 'true';
  const setValue = useCallback(
    (next: boolean) => {
      const sp = new URLSearchParams(params);
      if (next === defaultValue) sp.delete(key);
      else sp.set(key, next ? '1' : '0');
      setParams(sp, { replace: true });
    },
    [params, setParams, key, defaultValue],
  );
  return [value, setValue];
}

export function useNumberParam(
  key: string,
  defaultValue: number | null,
): [number | null, (next: number | null) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  const parsed = raw == null ? defaultValue : Number(raw);
  const value = Number.isFinite(parsed) ? (parsed as number) : defaultValue;
  const setValue = useCallback(
    (next: number | null) => {
      const sp = new URLSearchParams(params);
      if (next == null || next === defaultValue) sp.delete(key);
      else sp.set(key, String(next));
      setParams(sp, { replace: true });
    },
    [params, setParams, key, defaultValue],
  );
  return [value, setValue];
}

/**
 * Pipe-separated list of strings as a URL param. The returned Set is
 * derived fresh on every render so referential equality only changes
 * when the URL itself changes — safe to use in dependency arrays.
 *
 * Pipe (not comma) is the separator because labels containing commas
 * are common ("Has socials, cold site") and we need them to survive
 * the URL roundtrip intact.
 */
export function useStringSetParam(
  key: string,
): [Set<string>, (next: Set<string> | Iterable<string>) => void] {
  const [params, setParams] = useSearchParams();
  const raw = params.get(key);
  // Accept the legacy comma format too in case anyone has an old URL
  // saved, but ONLY when there's no pipe in the string. The moment we
  // see a pipe, the whole value is treated as pipe-delimited.
  const sep = raw && raw.includes('|') ? '|' : ',';
  const value = new Set(
    raw ? raw.split(sep).map((s) => s.trim()).filter(Boolean) : [],
  );
  const setValue = useCallback(
    (next: Set<string> | Iterable<string>) => {
      const arr = Array.from(next).filter(Boolean);
      const sp = new URLSearchParams(params);
      if (arr.length === 0) sp.delete(key);
      else sp.set(key, arr.join('|'));
      setParams(sp, { replace: true });
    },
    [params, setParams, key],
  );
  return [value, setValue];
}
