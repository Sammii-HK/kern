"use client";

import { useEffect, useState } from "react";
import { fallbackFaceCss, type FontMetrics } from "@/lib/metrics";
import { ROLES, type Role } from "@/lib/lab-state";
import type { RoleFont } from "@/hooks/use-role-fonts";
import type { RoleMetrics } from "@/hooks/use-role-metrics";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

const LABEL: Record<Role, string> = { heading: "Heading", body: "Body", mono: "Mono" };
const SIZE = 88;

/** Glyphs set at the same size with their measured x-height and cap height drawn in. */
function MetricGlyphs({ rf, m }: { rf: RoleFont; m?: FontMetrics }) {
  const baseline = SIZE * 1.05;
  return (
    <div className="relative" style={{ height: SIZE * 1.3 }}>
      {m && (
        <>
          <Guide y={baseline - m.capHeight * SIZE} label={`cap ${m.capHeight.toFixed(3)}`} />
          <Guide y={baseline - m.xHeight * SIZE} label={`x ${m.xHeight.toFixed(3)}`} accent />
          <Guide y={baseline} label="baseline" />
        </>
      )}
      <span
        className="absolute left-0 whitespace-nowrap"
        style={{
          fontFamily: rf.css,
          fontWeight: rf.weight,
          fontVariationSettings: rf.fvs,
          fontSize: SIZE,
          lineHeight: 1,
          // Place the baseline on the guide: the line box puts it at the ascent.
          top: m ? baseline - (m.ascent || 0.9) * SIZE - ((1 - (m.ascent + m.descent || 1)) * SIZE) / 2 : 0,
        }}
      >
        Hxg
      </span>
    </div>
  );
}

function Guide({ y, label, accent }: { y: number; label: string; accent?: boolean }) {
  return (
    <div className="absolute inset-x-0 flex items-center" style={{ top: y }}>
      <div className={cn("flex-1 border-t", accent ? "border-accent" : "border-border")} />
      <span className="text-[9px] text-muted ml-1 tabular-nums -translate-y-1/2">{label}</span>
    </div>
  );
}

/**
 * Overlays the web font and its size-adjusted fallback so the match can be
 * judged by eye: where the two agree, nothing will shift when the font loads.
 */
function FallbackOverlay({ rf, css }: { rf: RoleFont; css: string; }) {
  const [mode, setMode] = useState<"overlay" | "font" | "fallback">("overlay");
  useEffect(() => {
    const el = document.createElement("style");
    el.dataset.kernFallback = rf.name;
    el.textContent = css;
    document.head.appendChild(el);
    return () => el.remove();
  }, [css, rf.name]);
  const text =
    "Fallbacks matter for the second before the web font arrives. Matching widths keeps every line break in place.";
  const shared = { fontWeight: rf.weight, fontSize: 18, lineHeight: 1.5 } as const;
  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-1 text-[11px]">
        {(["overlay", "font", "fallback"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn("px-2 py-0.5 rounded border", mode === m ? "bg-foreground text-background border-foreground" : "border-border text-muted")}
          >
            {m === "overlay" ? "Overlay" : m === "font" ? "Web font" : "Fallback"}
          </button>
        ))}
      </div>
      <div className="relative">
        <p style={{ ...shared, fontFamily: rf.css, opacity: mode === "fallback" ? 0 : 1 }} className={mode === "overlay" ? "text-accent" : ""}>
          {text}
        </p>
        <p
          aria-hidden
          style={{ ...shared, fontFamily: `"${rf.name} Fallback"`, opacity: mode === "font" ? 0 : mode === "overlay" ? 0.55 : 1 }}
          className="absolute inset-0"
        >
          {text}
        </p>
      </div>
    </div>
  );
}

export function MetricsPanel({ roles, metrics }: { roles: Record<Role, RoleFont>; metrics: RoleMetrics }) {
  const [role, setRole] = useState<Role>("body");
  const m = metrics.metrics;
  const fb = metrics.fallbacks[role];
  const ratio = m.heading && m.body ? m.heading.xHeight / m.body.xHeight : undefined;

  return (
    <div className="flex flex-col gap-6" data-testid="metrics-panel">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {ROLES.map((r) => (
          <div key={r} className="rounded-lg border border-border p-4 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-baseline justify-between text-xs">
              <span className="font-medium">{LABEL[r]}</span>
              <span className="text-muted truncate ml-2">{roles[r].name}</span>
            </div>
            <MetricGlyphs rf={roles[r]} m={m[r]} />
            <p className="text-[11px] text-muted tabular-nums">
              {m[r]
                ? `x-height ${m[r]!.xHeight.toFixed(3)}em · cap ${m[r]!.capHeight.toFixed(3)}em · x/cap ${(m[r]!.xHeight / m[r]!.capHeight).toFixed(2)}`
                : roles[r].status === "error" ? "Could not load this family." : "Measuring once the font loads…"}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div className="rounded-lg border border-border p-4 flex flex-col gap-1">
          <span className="text-xs text-muted uppercase tracking-wider">Mono at body x-height</span>
          <span className="text-2xl tabular-nums" data-testid="mono-scale">
            {metrics.monoScale ? `${metrics.monoScale.toFixed(3)}em` : "…"}
          </span>
          <span className="text-xs text-muted">
            Inline code is set at this multiple of the surrounding text so its lowercase lines up with the body.
          </span>
        </div>
        <div className="rounded-lg border border-border p-4 flex flex-col gap-1">
          <span className="text-xs text-muted uppercase tracking-wider">Heading to body x-height</span>
          <span className="text-2xl tabular-nums">{ratio ? `${ratio.toFixed(2)}×` : "…"}</span>
          <span className="text-xs text-muted">
            {ratio
              ? ratio < 0.9
                ? "The heading face runs small: headings will look lighter than their size suggests."
                : ratio > 1.1
                  ? "The heading face runs large: consider a gentler ratio at the top of the scale."
                  : "Closely matched: sizes on the scale will read as intended across both faces."
              : "Measuring…"}
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">Size-matched fallback</h3>
          <div className="flex gap-1">
            {ROLES.map((r) => (
              <button
                key={r}
                onClick={() => setRole(r)}
                className={cn("px-2.5 py-1 text-xs rounded-md", role === r ? "bg-foreground text-background" : "text-muted border border-border")}
              >
                {LABEL[r]}
              </button>
            ))}
          </div>
        </div>
        {fb ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <FallbackOverlay rf={roles[role]} css={fallbackFaceCss(fb)} />
            <div className="rounded-lg border border-border p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted">
                  {fb.local} scaled to {roles[role].name}&apos;s average width
                </span>
                <CopyButton text={fallbackFaceCss(fb)} label="Copy" />
              </div>
              <pre className="text-xs font-mono text-foreground/80 whitespace-pre-wrap">{fallbackFaceCss(fb)}</pre>
            </div>
          </div>
        ) : (
          <p className="text-xs text-muted">Measuring…</p>
        )}
      </div>
    </div>
  );
}
