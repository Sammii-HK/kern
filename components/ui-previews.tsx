"use client";

import type { CSSProperties } from "react";
import { useParam } from "@/hooks/use-lab";
import type { Role } from "@/lib/lab-state";
import { monoStyle, textStyle } from "@/lib/system-style";
import { cn } from "@/lib/utils";

/*
 * Real interface fragments set in the chosen system. Every size comes from
 * the fluid scale (in cqi, so the frame's width drives it) and every face
 * from a role, so changing either on another page changes these.
 */

type T = (step: number, role?: Role) => CSSProperties;

function Article({ t }: { t: T }) {
  return (
    <article className="max-w-[68ch] mx-auto flex flex-col gap-[0.9em]" style={t(0)}>
      <p style={{ ...t(-1), textTransform: "uppercase", letterSpacing: "0.08em" }} className="opacity-60">
        Field notes · 6 min read
      </p>
      <h1 style={t(4, "heading")}>The quiet work of a good type scale</h1>
      <p style={t(1, "body")} className="opacity-75">
        Ratios, viewports and the small decisions that make a page feel considered.
      </p>
      <p>
        A scale is a promise that sizes relate to each other. When the base and ratio change with the viewport,
        headings can be <em>dramatic</em> on a wide screen without shouting on a phone, while body text stays
        comfortable at <strong>every width in between</strong>.
      </p>
      <h2 style={t(2, "heading")}>Leading follows size</h2>
      <p>
        Large type needs proportionally less space between lines. Here each step adds half the base size as a gap,
        so the body sits near 1.5 and display sizes settle close to 1.1. Set the scale with{" "}
        <code style={monoStyle()} className="px-1 rounded bg-black/5 dark:bg-white/10">clamp()</code> and it holds
        between the two viewports you chose.
      </p>
      <blockquote style={t(1, "heading")} className="border-l-2 border-current pl-4 italic opacity-90">
        Typography exists to honour content.
      </blockquote>
      <pre style={{ ...monoStyle(), ...t(-1, "mono"), fontSize: "var(--step--1)" }} className="rounded-md p-4 bg-black/5 dark:bg-white/10 overflow-x-auto">
{`h1 { font-size: var(--step-4); }
p  { font-size: var(--step-0); }`}
      </pre>
    </article>
  );
}

function Dashboard({ t }: { t: T }) {
  const stats = [
    { label: "Active readers", value: "12,480", delta: "+8.2%" },
    { label: "Avg. session", value: "4m 12s", delta: "+0.6%" },
    { label: "Conversion", value: "3.41%", delta: "−0.3%" },
  ];
  const rows = [
    ["Spring launch", "Live", "48,201", "£3,120"],
    ["Newsletter", "Scheduled", "12,904", "£840"],
    ["Retargeting", "Paused", "6,733", "£212"],
  ];
  return (
    <div className="flex flex-col gap-5" style={t(0)}>
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p style={t(-1)} className="opacity-60">Overview</p>
          <h1 style={t(3, "heading")}>Good morning, Ada</h1>
        </div>
        <button style={t(-1)} className="rounded-md bg-foreground text-background px-3 py-1.5">New report</button>
      </div>
      <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        {stats.map((s) => (
          <div key={s.label} className="rounded-lg border border-border p-4 flex flex-col gap-1">
            <span style={t(-1)} className="opacity-60">{s.label}</span>
            <span style={{ ...t(2, "heading"), fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
            <span style={{ ...t(-2), fontFamily: "var(--font-mono)" }} className={s.delta.startsWith("+") ? "text-green-600" : "text-red-500"}>
              {s.delta}
            </span>
          </div>
        ))}
      </div>
      <div className="rounded-lg border border-border overflow-x-auto">
        <table className="w-full" style={{ ...t(-1), fontVariantNumeric: "tabular-nums" }}>
          <thead className="text-left opacity-60">
            <tr className="border-b border-border">
              {["Campaign", "Status", "Impressions", "Spend"].map((h) => (
                <th key={h} className="px-4 py-2 font-medium">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r[0]} className="border-b border-border/50 last:border-0">
                <td className="px-4 py-2">{r[0]}</td>
                <td className="px-4 py-2">
                  <span className="rounded-full border border-border px-2 py-0.5" style={t(-2)}>{r[1]}</span>
                </td>
                <td className="px-4 py-2" style={{ fontFamily: "var(--font-mono)" }}>{r[2]}</td>
                <td className="px-4 py-2">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Pricing({ t }: { t: T }) {
  const plans = [
    { name: "Starter", price: "£0", note: "For trying things out", features: ["3 projects", "Community support"] },
    { name: "Studio", price: "£18", note: "For working designers", features: ["Unlimited projects", "Token export", "Priority support"], featured: true },
  ];
  return (
    <div className="flex flex-col gap-6 items-center" style={t(0)}>
      <div className="text-center flex flex-col gap-2 max-w-[48ch]">
        <h1 style={t(4, "heading")}>Simple pricing</h1>
        <p style={t(1)} className="opacity-70">Start free, upgrade when your system grows.</p>
      </div>
      <div className="grid gap-4 w-full" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {plans.map((p) => (
          <div
            key={p.name}
            className={cn("rounded-xl border p-6 flex flex-col gap-4", p.featured ? "border-foreground" : "border-border")}
          >
            <div className="flex items-center justify-between">
              <h2 style={t(1, "heading")}>{p.name}</h2>
              {p.featured && (
                <span style={{ ...t(-2), textTransform: "uppercase", letterSpacing: "0.08em" }} className="rounded-full bg-foreground text-background px-2 py-0.5">
                  Popular
                </span>
              )}
            </div>
            <p>
              <span style={{ ...t(5, "heading"), fontVariantNumeric: "lining-nums" }}>{p.price}</span>
              <span style={t(-1)} className="opacity-60"> / month</span>
            </p>
            <p style={t(-1)} className="opacity-70">{p.note}</p>
            <ul className="flex flex-col gap-1.5" style={t(-1)}>
              {p.features.map((f) => (
                <li key={f}>✓ {f}</li>
              ))}
            </ul>
            <button style={t(0)} className={cn("rounded-md px-4 py-2 mt-auto", p.featured ? "bg-foreground text-background" : "border border-border")}>
              {p.featured ? "Start a trial" : "Get started"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function Form({ t }: { t: T }) {
  const field = "w-full rounded-md border border-border bg-transparent px-3 py-2";
  return (
    <form className="max-w-[44ch] mx-auto flex flex-col gap-4" style={t(0)} onSubmit={(e) => e.preventDefault()}>
      <div className="flex flex-col gap-1">
        <h1 style={t(3, "heading")}>Create your account</h1>
        <p style={t(-1)} className="opacity-70">It takes less than a minute.</p>
      </div>
      <label className="flex flex-col gap-1.5">
        <span style={t(-1)} className="font-medium">Full name</span>
        <input className={field} style={t(0)} defaultValue="Ada Lovelace" />
      </label>
      <label className="flex flex-col gap-1.5">
        <span style={t(-1)} className="font-medium">Email</span>
        <input className={field} style={t(0)} placeholder="you@example.com" />
        <span style={t(-2)} className="opacity-60">We will never share it.</span>
      </label>
      <label className="flex flex-col gap-1.5">
        <span style={t(-1)} className="font-medium">API key</span>
        <input className={field} style={{ ...t(-1), fontFamily: "var(--font-mono)" }} defaultValue="kern_live_4f9a…c21" readOnly />
      </label>
      <label className="flex items-center gap-2" style={t(-1)}>
        <input type="checkbox" defaultChecked /> Send me product updates
      </label>
      <button type="submit" style={t(0)} className="rounded-md bg-foreground text-background px-4 py-2">
        Create account
      </button>
    </form>
  );
}

const PREVIEWS = {
  article: { label: "Article", Component: Article },
  dashboard: { label: "Dashboard", Component: Dashboard },
  pricing: { label: "Pricing", Component: Pricing },
  form: { label: "Form", Component: Form },
} as const;

const WIDTHS = [
  { id: "390", label: "Phone" },
  { id: "768", label: "Tablet" },
  { id: "1200", label: "Desktop" },
];

export function UiPreviews({ style, stepRange }: { style: CSSProperties; stepRange: [number, number] }) {
  const [tab, setTab] = useParam("pv", "article");
  const [width, setWidth] = useParam("pvw", "768");
  const [lo, hi] = stepRange;
  // Ask for a step the scale may not have and get the nearest one it does.
  const t: T = (step, role = "body") => textStyle(Math.min(hi, Math.max(lo, step)), role);
  const Active = (PREVIEWS[tab as keyof typeof PREVIEWS] ?? PREVIEWS.article).Component;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-1" role="tablist">
          {Object.entries(PREVIEWS).map(([id, p]) => (
            <button
              key={id}
              role="tab"
              aria-selected={tab === id}
              onClick={() => setTab(id)}
              className={cn("px-3 py-1.5 text-sm rounded-md", tab === id ? "bg-foreground text-background font-medium" : "text-muted border border-border")}
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex gap-1 text-xs">
          {WIDTHS.map((w) => (
            <button
              key={w.id}
              onClick={() => setWidth(w.id)}
              className={cn("px-2 py-1 rounded", width === w.id ? "bg-border text-foreground" : "text-muted")}
            >
              {w.label} {w.id}
            </button>
          ))}
        </div>
      </div>
      <div className="overflow-x-auto rounded-lg border border-border bg-surface">
        <div
          className="preview-frame mx-auto p-6 sm:p-8"
          style={{ ...style, width: Number(width), maxWidth: "none" }}
          data-testid="ui-preview"
        >
          <Active t={t} />
        </div>
      </div>
    </div>
  );
}
