"use client";

import { useSyncExternalStore } from "react";
import type { Catalogue, Family } from "@/lib/catalogue/types";

/*
 * The slimmed catalogue is fetched once per page load from /api/fonts and
 * shared by every component through a module-level store.
 */

interface Store {
  catalogue: Catalogue | null;
  byName: Map<string, Family>;
  error: string | null;
}

let store: Store = { catalogue: null, byName: new Map(), error: null };
let started = false;
const listeners = new Set<() => void>();
const EMPTY: Store = { catalogue: null, byName: new Map(), error: null };

function start() {
  if (started || typeof window === "undefined") return;
  started = true;
  fetch("/api/fonts")
    .then((r) => {
      if (!r.ok) throw new Error(`Catalogue request failed (${r.status})`);
      return r.json() as Promise<Catalogue>;
    })
    .then((catalogue) => {
      store = {
        catalogue,
        byName: new Map(catalogue.families.map((f) => [f.family, f])),
        error: null,
      };
    })
    .catch((err: Error) => {
      store = { ...store, error: err.message };
      started = false;
    })
    .finally(() => listeners.forEach((l) => l()));
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  start();
  return () => listeners.delete(listener);
}

export function useCatalogue(): Store {
  return useSyncExternalStore(
    subscribe,
    () => store,
    () => EMPTY
  );
}
