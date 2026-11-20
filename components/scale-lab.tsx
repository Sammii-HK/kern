"use client";

import { useMemo, useState } from "react";
import { useLab, useParam } from "@/hooks/use-lab";
import { useRoleFonts } from "@/hooks/use-role-fonts";
import { fvsString } from "@/lib/axes";
import {
  RATIOS,
  clampFor,
  generateScale,
  opszFor,
  round,
  sizeAt,
  stepName,
  type ScaleConfig,
  type Step,
} from "@/lib/scale";
import { systemStyle, textStyle } from "@/lib/system-style";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

function NumberField({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] text-muted uppercase tracking-wider">{label}</span>
      <div className="relative">
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (Number.isFinite(n) && e.target.value !== "") onChange(Math.min(max, Math.max(min, n)));
          }}
          className="w-full bg-surface border border-border rounded-md px-2.5 py-1.5 text-sm tabular-nums pr-8"
        />
        {suffix && <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-muted">{suffix}</span>}
      </div>
    </label>
  );
}

function RatioField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const preset = Object.entries(RATIOS).find(([, r]) => r === value)?.[0] ?? "custom";
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] text-muted uppercase tracking-wider">{label}</span>
      <div className="flex gap-1.5">
        <select
          value={preset}
          onChange={(e) => e.target.value !== "custom" && onChange(RATIOS[e.target.value as keyof typeof RATIOS])}
          className="flex-1 min-w-0 bg-surface border border-border rounded-md px-2 py-1.5 text-sm"
        >
          {Object.entries(RATIOS).map(([name, r]) => (
            <option key={name} value={name}>
              {name} ({r})
            </option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <input
          type="number"
          step={0.001}
          min={1.01}
          max={2}
          value={value}
          aria-label={`${label} value`}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (n >= 1.01 && n <= 2) onChange(n);
          }}
          className="w-20 bg-surface border border-border rounded-md px-2 py-1.5 text-sm tabular-nums"
        />
      </div>
    </div>
  );
}

/** Size against viewport for every step: flat, a ramp, then flat again. */
function ScaleChart({ steps, config, width }: { steps: Step[]; config: ScaleConfig; width: number }) {
  const W = 560;
  const H = 220;
  const pad = 28;
  const vMin = 240;
  const vMax = Math.max(1600, config.maxViewport + 200);
  const sMax = Math.max(...steps.map((s) => Math.max(s.min, s.max))) * 1.08;
  const x = (v: number) => pad + ((v - vMin) / (vMax - vMin)) * (W - pad * 2);
  const y = (s: number) => H - pad - (s / sMax) * (H - pad * 2);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto text-foreground" role="img" aria-label="Step size by viewport width">
      {[config.minViewport, config.maxViewport].map((v) => (
        <g key={v}>
          <line x1={x(v)} x2={x(v)} y1={pad / 2} y2={H - pad} stroke="var(--border)" strokeDasharray="3 3" />
          <text x={x(v)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--muted)">
            {v}px
          </text>
        </g>
      ))}
      <line x1={x(width)} x2={x(width)} y1={pad / 2} y2={H - pad} stroke="var(--accent)" />
      {steps.map((s) => {
        const pts = [vMin, config.minViewport, config.maxViewport, vMax].map((v) => `${x(v)},${y(sizeAt(s, v))}`);
        return (
          <g key={s.step}>
            <polyline points={pts.join(" ")} fill="none" stroke="currentColor" strokeOpacity={s.step === 0 ? 0.9 : 0.35} strokeWidth={s.step === 0 ? 2 : 1.25} />
            <text x={W - pad + 4} y={y(sizeAt(s, vMax)) + 3} fontSize="9" fill="var(--muted)">
              {s.step}
            </text>
            <circle cx={x(width)} cy={y(sizeAt(s, width))} r={2.5} fill="var(--accent)" />
          </g>
        );
      })}
    </svg>
  );
}

export function ScaleLab() {
  const { state, setScale, setHeadingFrom } = useLab();
  const roles = useRoleFonts(state);
  const [widthParam, setWidthParam] = useParam("pw", "800");
  const [opszMode, setOpszMode] = useParam("opsz", "auto");
  const [sample, setSample] = useState("Fluid type that holds its shape");
  const width = Math.min(1600, Math.max(320, Number(widthParam) || 800));
  const { scale } = state;

  const steps = useMemo(() => generateScale(scale), [scale]);
  const style = systemStyle(roles, steps, { unit: "cqi" });
  const headingOpsz = roles.heading.family?.axes.find((a) => a.tag === "opsz");
  const bodyOpsz = roles.body.family?.axes.find((a) => a.tag === "opsz");
  const css = `:root {\n${steps
    .map((s) => `  --${stepName(s.step)}: ${clampFor(s)};`)
    .join("\n")}\n}`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Fluid scale</h1>
        <p className="text-muted text-sm max-w-2xl">
          A base size and ratio for the smallest screen and another for the largest. Each step slides linearly
          between them with <code className="font-mono text-xs">clamp()</code>, and gets its own leading, tracking
          and optical size. Values are rounded once, at output.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-8 items-start">
        <aside className="flex flex-col gap-5 lg:sticky lg:top-20">
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Smallest viewport</h3>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Width" suffix="px" value={scale.minViewport} min={240} max={1200} step={10} onChange={(v) => setScale({ minViewport: v })} />
              <NumberField label="Base" suffix="px" value={scale.minBase} min={10} max={32} step={0.5} onChange={(v) => setScale({ minBase: v })} />
            </div>
            <RatioField label="Ratio" value={scale.minRatio} onChange={(v) => setScale({ minRatio: v })} />
          </section>
          <section className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold">Largest viewport</h3>
            <div className="grid grid-cols-2 gap-2">
              <NumberField label="Width" suffix="px" value={scale.maxViewport} min={480} max={2560} step={10} onChange={(v) => setScale({ maxViewport: v })} />
              <NumberField label="Base" suffix="px" value={scale.maxBase} min={10} max={40} step={0.5} onChange={(v) => setScale({ maxBase: v })} />
            </div>
            <RatioField label="Ratio" value={scale.maxRatio} onChange={(v) => setScale({ maxRatio: v })} />
          </section>
          <section className="grid grid-cols-3 gap-2">
            <NumberField label="Steps up" value={scale.stepsUp} min={1} max={10} onChange={(v) => setScale({ stepsUp: v })} />
            <NumberField label="Down" value={scale.stepsDown} min={0} max={5} onChange={(v) => setScale({ stepsDown: v })} />
            <NumberField label="Headings" value={state.headingFrom} min={-scale.stepsDown} max={scale.stepsUp} onChange={setHeadingFrom} />
          </section>
          <p className="text-[11px] text-muted -mt-2">Steps from “Headings” upwards use the heading face.</p>
          <CopyButton text={css} label="Copy clamp() values" />
        </aside>

        <div className="flex flex-col gap-8 min-w-0">
          <div className="rounded-lg border border-border p-4">
            <ScaleChart steps={steps} config={scale} width={width} />
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-wrap items-center gap-4 text-xs">
              <label className="flex items-center gap-2 flex-1 min-w-[220px]">
                <span className="text-muted uppercase tracking-wider">Preview width</span>
                <input type="range" min={320} max={1600} step={10} value={width} onChange={(e) => setWidthParam(e.target.value)} className="flex-1" aria-label="Preview width" />
                <span className="tabular-nums w-14 text-right">{width}px</span>
              </label>
              {(headingOpsz || bodyOpsz) && (
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                  {(["auto", "fixed"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setOpszMode(m)}
                      className={cn("px-2 py-1 rounded", opszMode === m ? "bg-foreground text-background" : "text-muted")}
                    >
                      {m === "auto" ? "opsz follows size" : "opsz fixed"}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="overflow-x-auto">
              <div className="preview-frame rounded-lg border border-dashed border-border px-6 py-5" style={{ ...style, width }}>
                {[...steps].reverse().map((s) => {
                  const role = s.step >= state.headingFrom ? "heading" : "body";
                  const rf = roles[role];
                  const range = role === "heading" ? headingOpsz : bodyOpsz;
                  const ts = textStyle(s.step, role);
                  if (range && opszMode === "fixed") {
                    ts.fontVariationSettings = fvsString({ ...rf.axes, opsz: range.default });
                  }
                  const px = sizeAt(s, width);
                  return (
                    <div key={s.step} className="flex items-baseline gap-4 py-1.5 border-b border-border/40 last:border-0">
                      <span className="w-14 shrink-0 text-[10px] font-mono text-muted tabular-nums">
                        {s.step}
                        <br />
                        {round(px, 1)}px
                      </span>
                      <p
                        style={ts}
                        className="min-w-0 truncate outline-none"
                        contentEditable
                        suppressContentEditableWarning
                        onBlur={(e) => setSample(e.currentTarget.textContent ?? sample)}
                      >
                        {sample}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-xs tabular-nums whitespace-nowrap" data-testid="scale-table">
              <thead className="text-muted text-left">
                <tr className="border-b border-border">
                  <th className="px-3 py-2 font-medium">Step</th>
                  <th className="px-3 py-2 font-medium">{scale.minViewport}px</th>
                  <th className="px-3 py-2 font-medium">{scale.maxViewport}px</th>
                  <th className="px-3 py-2 font-medium">Leading</th>
                  <th className="px-3 py-2 font-medium">Tracking</th>
                  <th className="px-3 py-2 font-medium">opsz</th>
                  <th className="px-3 py-2 font-medium">clamp()</th>
                </tr>
              </thead>
              <tbody>
                {[...steps].reverse().map((s) => {
                  const range = s.step >= state.headingFrom ? headingOpsz : bodyOpsz;
                  return (
                    <tr key={s.step} className="border-b border-border/50 last:border-0">
                      <td className="px-3 py-2 font-mono">{stepName(s.step)}</td>
                      <td className="px-3 py-2">{round(s.min, 2)}</td>
                      <td className="px-3 py-2">{round(s.max, 2)}</td>
                      <td className="px-3 py-2">{round(s.lineHeight, 3)}</td>
                      <td className="px-3 py-2">{round(s.tracking, 4)}em</td>
                      <td className="px-3 py-2">
                        {range ? `${round(opszFor(s.min, range), 1)} to ${round(opszFor(s.max, range), 1)}` : <span className="text-muted">n/a</span>}
                      </td>
                      <td className="px-3 py-2 font-mono whitespace-nowrap">{clampFor(s)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
