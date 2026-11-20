"use client";

import { useEffect, useMemo, useState } from "react";
import type { Family } from "@/lib/catalogue/types";
import { loadThumbnail } from "@/lib/font-loader";
import { measureFont } from "@/lib/metrics";
import { suggest, type Suggestion } from "@/lib/pairing";
import { useCatalogue } from "@/hooks/use-catalogue";
import { FontThumb } from "./font-thumb";
import { cn } from "@/lib/utils";

type Target = "body" | "heading" | "mono";

const xCache: Record<string, number> = {};

/** Loads x-and-H subsets for each family and measures the x-height. */
async function measureXHeights(families: string[]): Promise<Record<string, number>> {
  await Promise.all(
    families.map(async (name) => {
      if (xCache[name]) return;
      const alias = await loadThumbnail(name, `${name}xH`);
      if (!alias) return;
      const m = measureFont(`"${alias}", monospace`, { full: false });
      if (m && m.xHeight > 0.2 && m.xHeight < 0.9) xCache[name] = m.xHeight;
    })
  );
  return { ...xCache };
}

interface SuggestionsProps {
  target: Target;
  anchor: Family | undefined;
  current: string;
  onUse: (family: string) => void;
}

export function Suggestions({ target, anchor, current, onUse }: SuggestionsProps) {
  const { catalogue } = useCatalogue();
  const [xHeights, setXHeights] = useState<Record<string, number>>({ ...xCache });

  // First pass without metrics picks the shortlist worth measuring.
  const shortlist = useMemo(() => {
    if (!catalogue || !anchor) return [];
    return suggest(target, anchor, catalogue.families.slice(0, 600), { limit: 24 });
  }, [catalogue, anchor, target]);

  useEffect(() => {
    if (!anchor || !shortlist.length) return;
    let cancelled = false;
    measureXHeights([anchor.family, ...shortlist.map((s) => s.family.family)]).then((x) => {
      if (!cancelled) setXHeights(x);
    });
    return () => {
      cancelled = true;
    };
  }, [anchor, shortlist]);

  const ranked: Suggestion[] = useMemo(() => {
    if (!anchor) return [];
    return suggest(target, anchor, shortlist.map((s) => s.family), { xHeights, limit: 6 });
  }, [anchor, shortlist, target, xHeights]);

  if (!anchor) return <p className="text-xs text-muted">Waiting for the catalogue…</p>;

  return (
    <ul className="flex flex-col gap-2" data-testid={`suggestions-${target}`}>
      {ranked.map((s) => {
        const active = s.family.family === current;
        return (
          <li key={s.family.family}>
            <button
              onClick={() => onUse(s.family.family)}
              data-family={s.family.family}
              className={cn(
                "w-full text-left rounded-md border px-3 py-2.5 flex flex-col gap-1 transition-colors",
                active ? "border-foreground" : "border-border hover:border-muted"
              )}
            >
              <div className="flex items-baseline justify-between gap-2">
                <FontThumb family={s.family.family} className="text-lg truncate" />
                {xHeights[s.family.family] && (
                  <span className="text-[10px] text-muted tabular-nums shrink-0">
                    x {xHeights[s.family.family].toFixed(3)}em
                  </span>
                )}
              </div>
              {s.reasons.length > 0 && (
                <span className="text-[11px] text-muted leading-snug">{s.reasons.slice(0, 2).join(" · ")}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
