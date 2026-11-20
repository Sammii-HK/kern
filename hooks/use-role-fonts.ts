"use client";

import { useEffect, useMemo, useSyncExternalStore } from "react";
import { effectiveAxes, fvsString, roleWeight } from "@/lib/axes";
import type { Family } from "@/lib/catalogue/types";
import { genericFor, getStatus, loadFamily, subscribe, type LoadStatus } from "@/lib/font-loader";
import { ROLES, type LabState, type Role } from "@/lib/lab-state";
import { useCatalogue } from "./use-catalogue";

export interface RoleFont {
  role: Role;
  name: string;
  family?: Family;
  /** CSS font-family value. */
  css: string;
  axes: Record<string, number>;
  fvs: string;
  weight: number;
  status: LoadStatus;
}

export function useFontStatus(families: string[]): Record<string, LoadStatus> {
  const key = families.join("|");
  const snapshot = useSyncExternalStore(
    subscribe,
    () => families.map((f) => getStatus(f)).join("|"),
    () => families.map(() => "idle").join("|")
  );
  return useMemo(() => {
    const parts = snapshot.split("|");
    return Object.fromEntries(key.split("|").map((f, i) => [f, parts[i] as LoadStatus]));
  }, [key, snapshot]);
}

/** Loads a family as soon as it is known, returning its status. */
export function useLoadedFamily(family: Family | undefined, italic = true): LoadStatus {
  useEffect(() => {
    if (family) loadFamily(family, { italic });
  }, [family, italic]);
  return useFontStatus(family ? [family.family] : [])[family?.family ?? ""] ?? "idle";
}

export function useRoleFonts(state: LabState): Record<Role, RoleFont> {
  const { byName } = useCatalogue();
  const heading = byName.get(state.heading.family);
  const body = byName.get(state.body.family);
  const mono = byName.get(state.mono.family);

  useEffect(() => {
    if (heading) loadFamily(heading, { italic: false });
    if (body) loadFamily(body, { italic: true });
    if (mono) loadFamily(mono, { italic: false });
  }, [heading, body, mono]);

  const status = useFontStatus(ROLES.map((r) => state[r].family));

  return useMemo(() => {
    const families: Record<Role, Family | undefined> = { heading, body, mono };
    const out = {} as Record<Role, RoleFont>;
    for (const role of ROLES) {
      const family = families[role];
      const name = state[role].family;
      const axes = effectiveAxes(family, state[role].axes);
      out[role] = {
        role,
        name,
        family,
        css: `"${name}", ${family ? genericFor(family) : role === "mono" ? "monospace" : "sans-serif"}`,
        axes,
        fvs: fvsString(axes),
        weight: roleWeight(family, state[role].axes),
        status: status[name] ?? "idle",
      };
    }
    return out;
  }, [state, status, heading, body, mono]);
}
