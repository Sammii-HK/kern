import { DEFAULT_SCALE, type ScaleConfig } from "./scale";

/*
 * The whole type system lives in the query string so any state can be shared
 * or bookmarked. Only values that differ from the defaults are written.
 */

export type Role = "heading" | "body" | "mono";
export const ROLES: Role[] = ["heading", "body", "mono"];

export interface RoleState {
  family: string;
  /** Axis overrides. Missing axes use the family default. */
  axes: Record<string, number>;
}

export interface LabState {
  heading: RoleState;
  body: RoleState;
  mono: RoleState;
  scale: ScaleConfig;
  /** The first step set in the heading face. */
  headingFrom: number;
}

export const DEFAULT_STATE: LabState = {
  heading: { family: "Fraunces", axes: { wght: 600 } },
  body: { family: "Inter", axes: {} },
  mono: { family: "JetBrains Mono", axes: {} },
  scale: DEFAULT_SCALE,
  headingFrom: 1,
};

const ROLE_KEYS: Record<Role, [string, string]> = {
  heading: ["h", "hv"],
  body: ["b", "bv"],
  mono: ["m", "mv"],
};

const SCALE_KEYS: Record<keyof ScaleConfig, string> = {
  minViewport: "vmin",
  maxViewport: "vmax",
  minBase: "fmin",
  maxBase: "fmax",
  minRatio: "rmin",
  maxRatio: "rmax",
  stepsUp: "up",
  stepsDown: "down",
};

const SCALE_LIMITS: Record<keyof ScaleConfig, [number, number]> = {
  minViewport: [240, 1200],
  maxViewport: [480, 2560],
  minBase: [10, 32],
  maxBase: [10, 40],
  minRatio: [1.01, 2],
  maxRatio: [1.01, 2],
  stepsUp: [1, 10],
  stepsDown: [0, 5],
};

/** Every key that describes the system. Nav links carry exactly these. */
export const SYSTEM_KEYS = [
  ...Object.values(ROLE_KEYS).flat(),
  ...Object.values(SCALE_KEYS),
  "hs",
];

/** `wght.600_SOFT.50` ⇄ { wght: 600, SOFT: 50 } */
export function encodeAxes(axes: Record<string, number>): string {
  return Object.entries(axes)
    .filter(([, v]) => Number.isFinite(v))
    .map(([tag, v]) => `${tag}.${+v.toFixed(3)}`)
    .join("_");
}

export function decodeAxes(raw: string | null): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw) return out;
  for (const part of raw.split("_")) {
    const dot = part.indexOf(".");
    if (dot < 1) continue;
    const tag = part.slice(0, dot);
    const value = Number(part.slice(dot + 1));
    if (/^[A-Za-z0-9]{4}$/.test(tag) && Number.isFinite(value)) out[tag] = value;
  }
  return out;
}

function sameAxes(a: Record<string, number>, b: Record<string, number>) {
  const ka = Object.keys(a);
  return ka.length === Object.keys(b).length && ka.every((k) => a[k] === b[k]);
}

export function parseLabState(params: URLSearchParams): LabState {
  const state: LabState = structuredClone(DEFAULT_STATE);
  for (const role of Object.keys(ROLE_KEYS) as Role[]) {
    const [fk, vk] = ROLE_KEYS[role];
    const family = params.get(fk);
    if (family) {
      state[role] = { family, axes: decodeAxes(params.get(vk)) };
    } else if (params.has(vk)) {
      state[role].axes = decodeAxes(params.get(vk));
    }
  }
  for (const key of Object.keys(SCALE_KEYS) as (keyof ScaleConfig)[]) {
    const raw = params.get(SCALE_KEYS[key]);
    if (raw === null) continue;
    const n = Number(raw);
    if (!Number.isFinite(n)) continue;
    const [lo, hi] = SCALE_LIMITS[key];
    state.scale[key] = Math.min(hi, Math.max(lo, n));
  }
  if (state.scale.maxViewport <= state.scale.minViewport) {
    state.scale.maxViewport = state.scale.minViewport + 1;
  }
  const hs = Number(params.get("hs"));
  if (params.has("hs") && Number.isInteger(hs)) state.headingFrom = hs;
  return state;
}

/** Writes `state` into a copy of `base`, keeping unrelated params. */
export function serialiseLabState(state: LabState, base = new URLSearchParams()) {
  const params = new URLSearchParams(base);
  for (const role of Object.keys(ROLE_KEYS) as Role[]) {
    const [fk, vk] = ROLE_KEYS[role];
    const def = DEFAULT_STATE[role];
    const cur = state[role];
    const familyChanged = cur.family !== def.family;
    if (familyChanged) params.set(fk, cur.family);
    else params.delete(fk);
    // A new family always records its axes (even none) so defaults do not leak across.
    if (familyChanged || !sameAxes(cur.axes, def.axes)) {
      const encoded = encodeAxes(cur.axes);
      if (encoded || !familyChanged) params.set(vk, encoded);
      else params.delete(vk);
    } else params.delete(vk);
  }
  for (const key of Object.keys(SCALE_KEYS) as (keyof ScaleConfig)[]) {
    if (state.scale[key] !== DEFAULT_STATE.scale[key]) {
      params.set(SCALE_KEYS[key], String(+state.scale[key].toFixed(3)));
    } else params.delete(SCALE_KEYS[key]);
  }
  if (state.headingFrom !== DEFAULT_STATE.headingFrom) params.set("hs", String(state.headingFrom));
  else params.delete("hs");
  return params;
}

/** The query string for links between pages: system keys only. */
export function systemQuery(params: URLSearchParams): string {
  const out = new URLSearchParams();
  for (const key of SYSTEM_KEYS) {
    const v = params.get(key);
    if (v !== null) out.set(key, v);
  }
  const s = out.toString();
  return s ? `?${s}` : "";
}
