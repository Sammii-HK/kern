import type { Family } from "./catalogue/types";
import { effectiveAxes, fvsString, roleWeight } from "./axes";
import { css2Url, linkTags } from "./css2";
import type { LabState, Role } from "./lab-state";
import { ROLES } from "./lab-state";
import { fallbackFaceCss, type FallbackFace } from "./metrics";
import {
  clampFor,
  generateScale,
  lineHeightValue,
  opszFor,
  round,
  stepName,
  trackingValue,
  type Step,
} from "./scale";

/*
 * Export formats for one type system. All of them are generated from the same
 * inputs: the lab state, the catalogue entries for the three roles, and any
 * fallback faces measured in the browser.
 */

export interface ExportInput {
  state: LabState;
  families: Partial<Record<Role, Family>>;
  fallbacks?: Partial<Record<Role, FallbackFace>>;
  /** Font-size multiplier that sits the mono at the body's x-height. */
  monoScale?: number;
  /** Request full axis ranges instead of pinning custom axes. */
  fullRanges?: boolean;
}

const GENERIC: Record<Role, string> = { heading: "serif", body: "sans-serif", mono: "monospace" };

function genericFor(role: Role, family?: Family) {
  if (!family) return GENERIC[role];
  if (family.mono) return "monospace";
  if (family.category === "serif") return "serif";
  if (family.category === "handwriting") return "cursive";
  return "sans-serif";
}

export function fontStack(role: Role, input: ExportInput): string[] {
  const { state, families, fallbacks } = input;
  const stack = [state[role].family];
  const fb = fallbacks?.[role];
  if (fb) stack.push(fb.family);
  stack.push(genericFor(role, families[role]));
  return stack;
}

function cssStack(stack: string[]) {
  return stack
    .map((s) => (["serif", "sans-serif", "monospace", "cursive"].includes(s) ? s : `"${s}"`))
    .join(", ");
}

export function fontUrl(input: ExportInput): string {
  const requests = ROLES.flatMap((role) => {
    const family = input.families[role];
    if (!family) return [];
    // Two roles can share a family; ask for it once.
    return [{ role, family }];
  })
    .filter((r, i, all) => all.findIndex((o) => o.family.family === r.family.family) === i)
    .map(({ role, family }) => ({
      family,
      italic: role === "body",
      pin: input.fullRanges ? undefined : input.state[role].axes,
    }));
  return css2Url(requests);
}

export function linkSnippet(input: ExportInput): string {
  return linkTags(fontUrl(input));
}

/**
 * Variation settings for the axes the user moved away from their defaults.
 * wght is expressed as font-weight instead, and opsz is only included when
 * pinned, so font-optical-sizing: auto can do its job.
 */
function roleFvs(role: Role, input: ExportInput) {
  const family = input.families[role];
  const axes = effectiveAxes(family, input.state[role].axes);
  delete axes.wght;
  for (const axis of family?.axes ?? []) {
    if (axis.tag !== "opsz" && axes[axis.tag] === axis.default) delete axes[axis.tag];
  }
  return fvsString(axes);
}

export function headingRange(input: ExportInput) {
  return input.families.heading?.axes.find((a) => a.tag === "opsz");
}

export function scaleSteps(input: ExportInput): Step[] {
  return generateScale(input.state.scale);
}

export function exportCss(input: ExportInput): string {
  const steps = scaleSteps(input);
  const { state } = input;
  const lines: string[] = [];
  const faces = ROLES.map((r) => input.fallbacks?.[r]).filter(Boolean) as FallbackFace[];
  if (faces.length) {
    lines.push("/* Size-matched fallbacks: less layout shift while the web fonts load. */");
    lines.push(...faces.map(fallbackFaceCss), "");
  }

  lines.push(":root {");
  for (const role of ROLES) {
    lines.push(`  --font-${role}: ${cssStack(fontStack(role, input))};`);
    lines.push(`  --font-${role}-weight: ${roleWeight(input.families[role], state[role].axes)};`);
    const fvs = roleFvs(role, input);
    if (fvs !== "normal") lines.push(`  --font-${role}-variation: ${fvs};`);
  }
  if (input.monoScale && Math.abs(input.monoScale - 1) > 0.005) {
    lines.push(`  --font-mono-scale: ${round(input.monoScale, 3)}; /* matches the body x-height */`);
  }
  lines.push("");
  lines.push(
    `  /* Fluid scale: ${state.scale.minBase}px × ${state.scale.minRatio} at ${state.scale.minViewport}px to ${state.scale.maxBase}px × ${state.scale.maxRatio} at ${state.scale.maxViewport}px */`
  );
  for (const step of steps) {
    const n = stepName(step.step);
    lines.push(`  --${n}: ${clampFor(step)};`);
    lines.push(`  --${n}-leading: ${lineHeightValue(step)};`);
    lines.push(`  --${n}-tracking: ${trackingValue(step)};`);
  }
  lines.push("}", "");

  lines.push("/* opsz follows each step's rendered size through font-optical-sizing: auto. */");
  for (const step of steps) {
    const n = stepName(step.step);
    const role: Role = step.step >= state.headingFrom ? "heading" : "body";
    lines.push(`.${n} {`);
    lines.push(`  font-family: var(--font-${role});`);
    lines.push(`  font-weight: var(--font-${role}-weight);`);
    if (roleFvs(role, input) !== "normal") lines.push(`  font-variation-settings: var(--font-${role}-variation);`);
    lines.push(`  font-optical-sizing: auto;`);
    lines.push(`  font-size: var(--${n});`);
    lines.push(`  line-height: var(--${n}-leading);`);
    lines.push(`  letter-spacing: var(--${n}-tracking);`);
    lines.push("}");
  }
  lines.push("", "code, kbd, pre {", "  font-family: var(--font-mono);");
  if (input.monoScale && Math.abs(input.monoScale - 1) > 0.005) {
    lines.push("  font-size: calc(1em * var(--font-mono-scale));");
  }
  lines.push("}");
  return lines.join("\n");
}

/**
 * Tailwind v4 `@theme`. Each `--text-*` gets its companion line-height and
 * letter-spacing variables, so `text-step-2` sets all three.
 */
export function exportTailwind(input: ExportInput): string {
  const steps = scaleSteps(input);
  const lines: string[] = ['@import "tailwindcss";', ""];
  const faces = ROLES.map((r) => input.fallbacks?.[r]).filter(Boolean) as FallbackFace[];
  if (faces.length) lines.push(...faces.map(fallbackFaceCss), "");
  lines.push("@theme {");
  for (const role of ROLES) {
    lines.push(`  --font-${role}: ${cssStack(fontStack(role, input))};`);
  }
  lines.push("");
  for (const step of steps) {
    const n = stepName(step.step);
    lines.push(`  --text-${n}: ${clampFor(step)};`);
    lines.push(`  --text-${n}--line-height: ${lineHeightValue(step)};`);
    lines.push(`  --text-${n}--letter-spacing: ${trackingValue(step)};`);
  }
  lines.push("}");
  const weights = ROLES.map((role) => ({
    role,
    weight: roleWeight(input.families[role], input.state[role].axes),
    fvs: roleFvs(role, input),
  }));
  lines.push("");
  lines.push("/* Usage: <h1 class=\"font-heading text-step-4\"> */");
  lines.push("@layer base {");
  for (const { role, weight, fvs } of weights) {
    const selector = role === "heading" ? "h1, h2, h3, h4" : role === "mono" ? "code, kbd, pre" : "body";
    lines.push(`  ${selector} {`);
    lines.push(`    font-family: var(--font-${role});`);
    lines.push(`    font-weight: ${weight};`);
    if (fvs !== "normal") lines.push(`    font-variation-settings: ${fvs};`);
    lines.push("  }");
  }
  lines.push("}");
  return lines.join("\n");
}

type Dimension = { value: number; unit: "px" | "rem" };
const rem = (px: number): Dimension => ({ value: round(px / 16, 4), unit: "rem" });

/**
 * W3C Design Tokens (DTCG 2025.10). DTCG has no fluid dimension, so each step
 * is a pair of typography tokens, one per viewport end, and the clamp() rides
 * along in $extensions for tools that understand it.
 */
export function exportDtcg(input: ExportInput): string {
  const { state } = input;
  const steps = scaleSteps(input);
  const opsz = headingRange(input);
  const ext = "dev.sammii.kern";

  const family: Record<string, unknown> = {};
  const weight: Record<string, unknown> = {};
  for (const role of ROLES) {
    family[role] = { $type: "fontFamily", $value: fontStack(role, input) };
    weight[role] = {
      $type: "fontWeight",
      $value: roleWeight(input.families[role], state[role].axes),
    };
    const fvs = roleFvs(role, input);
    if (fvs !== "normal") {
      (family[role] as Record<string, unknown>).$extensions = {
        [ext]: { fontVariationSettings: fvs },
      };
    }
  }

  const viewport = {
    min: { $type: "dimension", $value: { value: state.scale.minViewport, unit: "px" } },
    max: { $type: "dimension", $value: { value: state.scale.maxViewport, unit: "px" } },
  };

  const typography: Record<string, unknown> = {};
  for (const step of steps) {
    const role: Role = step.step >= state.headingFrom ? "heading" : "body";
    const end = (size: number) => ({
      $type: "typography",
      $value: {
        fontFamily: `{font.family.${role}}`,
        fontWeight: `{font.weight.${role}}`,
        fontSize: rem(size),
        lineHeight: lineHeightValue(step),
        // DTCG dimensions are px or rem only, so em tracking is resolved at this size.
        letterSpacing: { value: round(step.tracking * size, 3), unit: "px" },
      },
      ...(role === "heading" && opsz
        ? { $extensions: { [ext]: { opsz: round(opszFor(size, opsz), 2) } } }
        : {}),
    });
    typography[stepName(step.step)] = {
      $description: `Step ${step.step}: ${round(step.min, 2)}px at ${state.scale.minViewport}px to ${round(step.max, 2)}px at ${state.scale.maxViewport}px`,
      $extensions: {
        [ext]: { clamp: clampFor(step), tracking: trackingValue(step) },
      },
      min: end(step.min),
      max: end(step.max),
    };
  }

  const tokens = {
    $description: "Type system exported from Kern",
    font: { family, weight },
    viewport,
    typography,
  };
  return JSON.stringify(tokens, null, 2);
}
