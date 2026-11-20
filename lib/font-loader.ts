"use client";

import type { Family } from "./catalogue/types";
import { css2TextUrl, css2Url } from "./css2";

/*
 * On-demand font loading. Full families are injected as css2 <link>s with
 * their axis ranges; thumbnails fetch a `text=` subset and register it under
 * an alias through the FontFace API, so a static subset can never shadow the
 * variable face of the same family.
 */

export type LoadStatus = "idle" | "loading" | "ready" | "error";

const status = new Map<string, LoadStatus>();
const pending = new Map<string, Promise<void>>();
const listeners = new Set<() => void>();

function setStatus(key: string, s: LoadStatus) {
  status.set(key, s);
  listeners.forEach((l) => l());
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getStatus(family: string): LoadStatus {
  return status.get(family) ?? "idle";
}

/** CSS font-family value for a loaded family, with a generic fallback. */
export function cssFamily(family: string, generic = "sans-serif"): string {
  return `"${family}", ${generic}`;
}

export function genericFor(f: Pick<Family, "category" | "mono">): string {
  if (f.mono) return "monospace";
  if (f.category === "serif") return "serif";
  if (f.category === "handwriting") return "cursive";
  return "sans-serif";
}

export function loadFamily(family: Family, opts: { italic?: boolean } = {}): Promise<void> {
  const key = family.family;
  const italic = (opts.italic ?? true) && family.italic;
  // An italic request also covers upright, so it satisfies either.
  const existing = pending.get(`${key}:i`) ?? (italic ? undefined : pending.get(key));
  if (existing) return existing;
  if (typeof document === "undefined") return Promise.resolve();

  if (getStatus(key) !== "ready") setStatus(key, "loading");
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = css2Url([{ family, italic }]);
  link.dataset.family = key;

  const promise = new Promise<void>((resolve) => {
    link.onload = async () => {
      try {
        const weight = family.axes.find((a) => a.tag === "wght")?.default ?? family.weights[0] ?? 400;
        await document.fonts.load(`${weight} 1em "${key}"`);
        setStatus(key, "ready");
      } catch {
        setStatus(key, "error");
      }
      resolve();
    };
    link.onerror = () => {
      setStatus(key, "error");
      resolve();
    };
  });
  document.head.appendChild(link);
  pending.set(italic ? `${key}:i` : key, promise);
  return promise;
}

// Thumbnails ---------------------------------------------------------------

const thumbs = new Map<string, Promise<string | null>>();
const queue: (() => void)[] = [];
let active = 0;
const MAX_CONCURRENT = 6;

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active++;
      task()
        .then(resolve, reject)
        .finally(() => {
          active--;
          queue.shift()?.();
        });
    };
    if (active < MAX_CONCURRENT) run();
    else queue.push(run);
  });
}

export function thumbAlias(family: string) {
  return `kern-thumb ${family}`;
}

/** Loads a text-only subset of `family` and resolves to its alias, or null. */
export function loadThumbnail(family: string, text: string): Promise<string | null> {
  const cached = thumbs.get(family);
  if (cached) return cached;
  const promise = schedule(async () => {
    try {
      const css = await fetch(css2TextUrl(family, text)).then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.text();
      });
      const src = css.match(/src:\s*(url\([^)]+\)(?:\s*format\([^)]+\))?)/)?.[1];
      if (!src) return null;
      const alias = thumbAlias(family);
      const face = new FontFace(alias, src);
      await face.load();
      document.fonts.add(face);
      return alias;
    } catch {
      return null;
    }
  });
  thumbs.set(family, promise);
  return promise;
}
