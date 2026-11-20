"use client";

import { useMemo, useState } from "react";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useLab } from "@/hooks/use-lab";
import { useRoleFonts } from "@/hooks/use-role-fonts";
import { roleSizes, useRoleMetrics } from "@/hooks/use-role-metrics";
import type { Family } from "@/lib/catalogue/types";
import { CURATED } from "@/lib/pairing";
import { generateScale } from "@/lib/scale";
import { systemStyle } from "@/lib/system-style";
import { FamilyPicker } from "./family-picker";
import { MetricsPanel } from "./metrics-panel";
import { Suggestions } from "./suggestions";
import { UiPreviews } from "./ui-previews";
import { cn } from "@/lib/utils";

const isMono = (f: Family) => f.mono;
type Tab = "body" | "heading" | "mono";

export function PairingLab() {
  const { state, update, setRoleFamily } = useLab();
  const { byName } = useCatalogue();
  const roles = useRoleFonts(state);
  const sizes = roleSizes(state);
  const metrics = useRoleMetrics(roles, sizes);
  const [tab, setTab] = useState<Tab>("body");

  const steps = useMemo(() => generateScale(state.scale), [state.scale]);
  const style = systemStyle(roles, steps, { unit: "cqi", monoScale: metrics.monoScale ?? 1 });

  const anchor = tab === "body" ? roles.heading.family : roles.body.family;
  const curated = CURATED.filter((p) => byName.has(p.heading) && byName.has(p.body));

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Pairing</h1>
        <p className="text-muted text-sm max-w-2xl">
          Choose a heading, body and mono face. Suggestions weigh category contrast, a hand-picked list and
          x-heights measured from each font, and say why they were suggested.
        </p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)] gap-8 items-start">
        <div className="flex flex-col gap-5">
          <FamilyPicker label="Heading" value={state.heading.family} onChange={(f) => setRoleFamily("heading", f)} testId="picker-heading" />
          <FamilyPicker label="Body" value={state.body.family} onChange={(f) => setRoleFamily("body", f)} testId="picker-body" />
          <FamilyPicker label="Mono" value={state.mono.family} onChange={(f) => setRoleFamily("mono", f)} filter={isMono} testId="picker-mono" />

          <div className="flex flex-col gap-3 pt-2">
            <div className="flex gap-1 text-xs">
              {(["body", "heading", "mono"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={cn("px-2.5 py-1 rounded-md", tab === t ? "bg-foreground text-background" : "text-muted border border-border")}
                >
                  {t === "body" ? "Body for heading" : t === "heading" ? "Heading for body" : "Mono for body"}
                </button>
              ))}
            </div>
            <Suggestions
              target={tab}
              anchor={anchor}
              current={state[tab].family}
              onUse={(f) => setRoleFamily(tab, f)}
            />
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <span className="text-xs text-muted uppercase tracking-wider font-medium">Curated systems</span>
            <div className="flex flex-col gap-1">
              {curated.map((p) => (
                <button
                  key={p.heading + p.body}
                  onClick={() =>
                    update((s) => ({
                      ...s,
                      heading: { family: p.heading, axes: {} },
                      body: { family: p.body, axes: {} },
                      mono: p.mono && byName.has(p.mono) ? { family: p.mono, axes: {} } : s.mono,
                    }))
                  }
                  title={p.note}
                  className="text-left text-xs px-2 py-1.5 rounded hover:bg-surface border border-transparent hover:border-border"
                >
                  <span className="font-medium">{p.heading}</span>
                  <span className="text-muted"> with {p.body}{p.mono ? ` and ${p.mono}` : ""}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        <UiPreviews style={style} stepRange={[-state.scale.stepsDown, state.scale.stepsUp]} />
      </section>

      <section className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-xl font-semibold tracking-tight">Measured metrics</h2>
          <p className="text-sm text-muted max-w-2xl">
            Read from the loaded fonts with canvas text metrics, each at the size the role is used (body at the
            base, headings two steps up), so optical-size families report the cut you will actually see. They
            drive the mono size match and the fallback faces that cut layout shift while the web fonts load.
          </p>
        </div>
        <MetricsPanel roles={roles} metrics={metrics} sizes={sizes} />
      </section>
    </div>
  );
}
