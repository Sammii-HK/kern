"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  parseLabState,
  serialiseLabState,
  type LabState,
  type Role,
} from "@/lib/lab-state";
import type { ScaleConfig } from "@/lib/scale";

/**
 * Writes to the URL with the History API, which Next keeps in sync with
 * useSearchParams without a server round trip. Fast enough for slider drags.
 */
function replaceQuery(pathname: string, params: URLSearchParams) {
  const qs = params.toString();
  window.history.replaceState(null, "", qs ? `${pathname}?${qs}` : pathname);
}

export function useLab() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const state = useMemo(
    () => parseLabState(new URLSearchParams(searchParams.toString())),
    [searchParams]
  );

  const update = useCallback(
    (fn: (s: LabState) => LabState) => {
      const current = new URLSearchParams(window.location.search);
      const next = fn(parseLabState(current));
      replaceQuery(pathname, serialiseLabState(next, current));
    },
    [pathname]
  );

  const setRoleFamily = useCallback(
    (role: Role, family: string) =>
      update((s) => ({ ...s, [role]: { family, axes: {} } })),
    [update]
  );

  const setRoleAxis = useCallback(
    (role: Role, tag: string, value: number | undefined) =>
      update((s) => {
        const axes = { ...s[role].axes };
        if (value === undefined) delete axes[tag];
        else axes[tag] = value;
        return { ...s, [role]: { ...s[role], axes } };
      }),
    [update]
  );

  const resetRoleAxes = useCallback(
    (role: Role) => update((s) => ({ ...s, [role]: { ...s[role], axes: {} } })),
    [update]
  );

  const setScale = useCallback(
    (patch: Partial<ScaleConfig>) => update((s) => ({ ...s, scale: { ...s.scale, ...patch } })),
    [update]
  );

  const setHeadingFrom = useCallback(
    (headingFrom: number) => update((s) => ({ ...s, headingFrom })),
    [update]
  );

  return { state, update, setRoleFamily, setRoleAxis, resetRoleAxes, setScale, setHeadingFrom };
}

/** A single page-local query parameter, such as a search term or a tab. */
export function useParam(name: string, fallback = ""): [string, (v: string) => void] {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const value = searchParams.get(name) ?? fallback;
  const set = useCallback(
    (v: string) => {
      const params = new URLSearchParams(window.location.search);
      if (v === fallback || v === "") params.delete(name);
      else params.set(name, v);
      replaceQuery(pathname, params);
    },
    [name, fallback, pathname]
  );
  return [value, set];
}
