"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { effectiveAxes, roleWeight } from "@/lib/axes";
import type { AxisInfo, Family } from "@/lib/catalogue/types";
import { genericFor } from "@/lib/font-loader";
import { ROLES, type Role } from "@/lib/lab-state";
import { useLab } from "@/hooks/use-lab";
import { useLoadedFamily } from "@/hooks/use-role-fonts";
import { AxisPanel } from "./axis-panel";
import { SpringText } from "./spring-text";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = { heading: "Heading", body: "Body", mono: "Mono" };

export function FamilyDetail({ family, registry }: { family: Family; registry: Record<string, AxisInfo> }) {
  const status = useLoadedFamily(family);
  const { state, update } = useLab();
  const [overrides, setOverrides] = useState<Record<string, number>>({});
  const axes = effectiveAxes(family, overrides);
  const css = `"${family.family}", ${genericFor(family)}`;

  const assign = (role: Role) =>
    update((s) => ({ ...s, [role]: { family: family.family, axes: { ...overrides } } }));

  return (
    <div className="flex flex-col gap-5 rounded-lg border border-border p-5" data-testid="family-detail">
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">{family.family}</h2>
        <p className="text-xs text-muted">
          Popularity rank {family.popularity} · {family.italic ? "with italics" : "upright only"} ·{" "}
          {status === "ready" ? "loaded" : status === "error" ? "failed to load" : "loading…"}
        </p>
      </div>

      <SpringText
        as="div"
        axes={axes}
        contentEditable
        className={cn("text-5xl leading-[1.1] outline-none break-words", status !== "ready" && "opacity-40")}
        style={{ fontFamily: css, fontWeight: roleWeight(family, overrides) }}
      >
        Hamburgefonstiv
      </SpringText>
      <SpringText
        axes={axes}
        className="text-sm leading-relaxed"
        style={{ fontFamily: css, fontWeight: roleWeight(family, overrides) }}
      >
        Sphinx of black quartz, judge my vow. 0123456789
      </SpringText>

      <AxisPanel
        family={family}
        registry={registry}
        overrides={overrides}
        title="Axes"
        onChange={(tag, value) =>
          setOverrides((o) => {
            const next = { ...o };
            if (value === undefined) delete next[tag];
            else next[tag] = value;
            return next;
          })
        }
        onReset={() => setOverrides({})}
      />

      <div className="flex flex-col gap-2">
        <span className="text-xs text-muted uppercase tracking-wider font-medium">Use in your system</span>
        <div className="grid grid-cols-3 gap-2">
          {ROLES.map((role) => {
            const current = state[role].family === family.family;
            const disabled = role === "mono" && !family.mono;
            return (
              <button
                key={role}
                disabled={disabled}
                onClick={() => assign(role)}
                data-testid={`assign-${role}`}
                title={disabled ? "Only monospaced families can take the mono role" : undefined}
                className={cn(
                  "flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-md border transition-colors",
                  current ? "bg-foreground text-background border-foreground" : "border-border hover:bg-surface",
                  disabled && "opacity-40 cursor-not-allowed"
                )}
              >
                {current && <Check size={12} />}
                {ROLE_LABEL[role]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
