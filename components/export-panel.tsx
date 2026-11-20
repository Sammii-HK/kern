"use client";

import { useMemo, useState } from "react";
import { Download, Link2 } from "lucide-react";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useLab, useParam } from "@/hooks/use-lab";
import { useRoleFonts } from "@/hooks/use-role-fonts";
import { roleSizes, useRoleMetrics } from "@/hooks/use-role-metrics";
import { exportCss, exportDtcg, exportTailwind, linkSnippet, type ExportInput } from "@/lib/export";
import { ROLES } from "@/lib/lab-state";
import { CopyButton } from "./copy-button";
import { cn } from "@/lib/utils";

const FORMATS = {
  css: { label: "CSS variables", file: "type-system.css", mime: "text/css" },
  tailwind: { label: "Tailwind v4", file: "theme.css", mime: "text/css" },
  dtcg: { label: "Design tokens", file: "typography.tokens.json", mime: "application/json" },
  link: { label: "Font <link>", file: "fonts.html", mime: "text/html" },
} as const;
type Format = keyof typeof FORMATS;

export function ExportPanel() {
  const { state } = useLab();
  const { byName } = useCatalogue();
  const roles = useRoleFonts(state);
  const metrics = useRoleMetrics(roles, roleSizes(state));
  const [format, setFormat] = useParam("fmt", "css");
  const [full, setFull] = useParam("full", "0");
  const [shared, setShared] = useState(false);
  const fmt = (format in FORMATS ? format : "css") as Format;

  const input: ExportInput = useMemo(
    () => ({
      state,
      families: Object.fromEntries(ROLES.map((r) => [r, byName.get(state[r].family)])),
      fallbacks: metrics.fallbacks,
      monoScale: metrics.monoScale,
      fullRanges: full === "1",
    }),
    [state, byName, metrics, full]
  );

  const output = useMemo(() => {
    if (!ROLES.every((r) => input.families[r])) return "Loading the catalogue…";
    switch (fmt) {
      case "tailwind":
        return exportTailwind(input);
      case "dtcg":
        return exportDtcg(input);
      case "link":
        return linkSnippet(input);
      default:
        return exportCss(input);
    }
  }, [fmt, input]);

  const download = () => {
    const blob = new Blob([output], { type: FORMATS[fmt].mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = FORMATS[fmt].file;
    a.click();
    URL.revokeObjectURL(url);
  };

  const measured = ROLES.filter((r) => metrics.fallbacks[r]).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Export</h1>
        <p className="text-muted text-sm max-w-2xl">
          The same system in four formats: CSS custom properties with step classes, a Tailwind v4{" "}
          <code className="font-mono text-xs">@theme</code>, W3C design tokens (DTCG) and the Google Fonts link.
          Everything here is also in the page URL, so the link reproduces it exactly.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 justify-between">
        <div className="flex gap-1 flex-wrap" role="tablist">
          {(Object.keys(FORMATS) as Format[]).map((f) => (
            <button
              key={f}
              role="tab"
              aria-selected={fmt === f}
              data-testid={`format-${f}`}
              onClick={() => setFormat(f)}
              className={cn("px-3 py-1.5 text-sm rounded-md", fmt === f ? "bg-foreground text-background font-medium" : "text-muted border border-border")}
            >
              {FORMATS[f].label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(window.location.href);
              setShared(true);
              setTimeout(() => setShared(false), 2000);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-surface"
          >
            <Link2 size={14} />
            {shared ? "Link copied" : "Copy share link"}
          </button>
          <button onClick={download} className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border border-border hover:bg-surface">
            <Download size={14} />
            {FORMATS[fmt].file}
          </button>
          <CopyButton text={output} label="Copy" />
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted">
        <label className="flex items-center gap-1.5 cursor-pointer">
          <input type="checkbox" checked={full === "1"} onChange={(e) => setFull(e.target.checked ? "1" : "0")} />
          Request full axis ranges (otherwise custom axes are pinned to your values for smaller files)
        </label>
        <span>
          Fallback faces: {measured}/3 measured{measured < 3 ? " (still loading)" : ""}
        </span>
      </div>

      <pre
        data-testid="export-output"
        className="rounded-lg border border-border bg-surface p-4 text-xs font-mono text-foreground/85 whitespace-pre overflow-x-auto max-h-[70vh]"
      >
        {output}
      </pre>
    </div>
  );
}
