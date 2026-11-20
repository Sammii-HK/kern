"use client";

import { useCatalogue } from "@/hooks/use-catalogue";
import { useLab, useParam } from "@/hooks/use-lab";
import { useRoleFonts } from "@/hooks/use-role-fonts";
import { fvsString } from "@/lib/axes";
import { ROLES, type Role } from "@/lib/lab-state";
import { AxisPanel } from "@/components/axis-panel";
import { FontPreview } from "@/components/font-preview";
import { OpticalSizeDemo } from "@/components/optical-size-demo";
import { ComparisonView } from "@/components/comparison-view";
import { CopyButton } from "@/components/copy-button";
import { ColourPicker } from "@/components/colour-picker";
import { FamilyPicker } from "@/components/family-picker";
import { cn } from "@/lib/utils";

const LABEL: Record<Role, string> = { heading: "Heading", body: "Body", mono: "Mono" };

export default function PlaygroundPage() {
  const { state, setRoleAxis, resetRoleAxes, setRoleFamily } = useLab();
  const { catalogue } = useCatalogue();
  const roles = useRoleFonts(state);
  const [roleParam, setRoleParam] = useParam("role", "heading");
  const [mode, setMode] = useParam("mode", "single");
  const [sizeParam, setSizeParam] = useParam("size", "72");
  const [textColour, setTextColour] = useParam("color");
  const [bgColour, setBgColour] = useParam("bg");
  const role = (ROLES.includes(roleParam as Role) ? roleParam : "heading") as Role;
  const rf = roles[role];
  const fontSize = Number(sizeParam) || 72;

  const cssSnippet = `font-family: ${rf.css};
font-weight: ${rf.weight};
font-variation-settings: ${fvsString(rf.axes)};
font-optical-sizing: auto;
font-size: ${fontSize}px;`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Playground</h1>
        <p className="text-muted text-sm max-w-xl">
          Tune each role&apos;s axes. The glyphs move on a spring towards every new value (or jump, if you prefer
          reduced motion), and the settings are saved in the URL.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 p-1 bg-border/50 rounded-lg">
          {ROLES.map((r) => (
            <button
              key={r}
              onClick={() => setRoleParam(r)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md whitespace-nowrap",
                role === r ? "bg-surface text-foreground shadow-sm font-medium" : "text-muted hover:text-foreground"
              )}
            >
              {LABEL[r]}
              <span className="ml-1.5 text-xs text-muted">{state[r].family}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-1">
          {(["single", "compare"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 text-sm rounded-md",
                mode === m ? "bg-foreground text-background font-medium" : "text-muted hover:text-foreground border border-border"
              )}
            >
              {m === "single" ? "Single" : "Compare"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
          <FamilyPicker
            label={`${LABEL[role]} family`}
            value={state[role].family}
            onChange={(f) => setRoleFamily(role, f)}
            filter={role === "mono" ? (f) => f.mono : undefined}
          />
          {rf.family && catalogue ? (
            <AxisPanel
              family={rf.family}
              registry={catalogue.axisRegistry}
              overrides={state[role].axes}
              onChange={(tag, v) => setRoleAxis(role, tag, v)}
              onReset={() => resetRoleAxes(role)}
            />
          ) : (
            <p className="text-xs text-muted">Loading axes…</p>
          )}
          {mode === "single" && (
            <>
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between text-xs">
                  <label className="text-muted uppercase tracking-wider font-medium">Font size</label>
                  <span className="tabular-nums font-medium">{fontSize}px</span>
                </div>
                <input type="range" min={12} max={200} value={fontSize} onChange={(e) => setSizeParam(e.target.value)} className="w-full" />
              </div>
              <ColourPicker textColour={textColour} bgColour={bgColour} onTextChange={setTextColour} onBgChange={setBgColour} />
            </>
          )}
          <CopyButton text={cssSnippet} />
        </aside>

        <div className="flex flex-col gap-6 min-w-0">
          {mode === "compare" ? (
            <ComparisonView left={rf} />
          ) : (
            <>
              <FontPreview font={rf} fontSize={fontSize} textColour={textColour || undefined} bgColour={bgColour || undefined} />
              <OpticalSizeDemo font={rf} family={rf.family} />
              <div className="border border-border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-xs uppercase tracking-wider text-muted font-medium">CSS</h4>
                  <CopyButton text={cssSnippet} />
                </div>
                <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap">{cssSnippet}</pre>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
