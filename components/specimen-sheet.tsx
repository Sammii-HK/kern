"use client";

import { useLab, useParam } from "@/hooks/use-lab";
import { useRoleFonts, type RoleFont } from "@/hooks/use-role-fonts";
import { ROLES, type Role } from "@/lib/lab-state";
import { SpringText } from "./spring-text";
import { cn } from "@/lib/utils";

const pangrams = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "Sphinx of black quartz, judge my vow",
];
const LABEL: Record<Role, string> = { heading: "Heading", body: "Body", mono: "Mono" };

function weightsFor(rf: RoleFont): number[] {
  const wght = rf.family?.axes.find((a) => a.tag === "wght");
  if (!wght) return rf.family?.weights ?? [400];
  const out: number[] = [];
  for (let w = Math.ceil(wght.min / 100) * 100; w <= wght.max; w += 100) out.push(w);
  return out;
}

function FontSpecimen({ rf }: { rf: RoleFont }) {
  const variable = !!rf.family?.axes.length;
  // Weight lines set wght through the spring for variable fonts, font-weight for static ones.
  const lineStyle = (w: number) => (variable ? { fontFamily: rf.css } : { fontFamily: rf.css, fontWeight: w });
  const lineAxes = (w: number) => (variable ? { ...rf.axes, wght: w } : {});

  return (
    <section className="flex flex-col gap-10">
      <div className="flex flex-col gap-2">
        <SpringText as="h2" axes={rf.axes} className="text-5xl sm:text-7xl tracking-tight" style={{ fontFamily: rf.css, fontWeight: rf.weight }}>
          {rf.name}
        </SpringText>
        <p className="text-xs text-muted">
          {rf.family
            ? `${rf.family.axes.length ? `Variable: ${rf.family.axes.map((a) => `${a.tag} ${a.min}–${a.max}`).join(", ")}` : `Static: ${rf.family.weights.join(", ")}`}`
            : "Loading…"}
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">Character set</p>
        <SpringText as="div" axes={rf.axes} className="text-3xl sm:text-4xl leading-relaxed tracking-wide break-words" style={{ fontFamily: rf.css, fontWeight: rf.weight }}>
          <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p>abcdefghijklmnopqrstuvwxyz</p>
          <p>0123456789 !@#$%&amp;*(),.;:</p>
        </SpringText>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">Weights</p>
        <div className="flex flex-col gap-2">
          {weightsFor(rf).map((w) => (
            <div key={w} className="flex items-baseline gap-3">
              <span className="text-xs text-muted tabular-nums w-10 shrink-0">{w}</span>
              <SpringText axes={lineAxes(w)} className="text-xl sm:text-2xl truncate" style={lineStyle(w)}>
                The quick brown fox jumps over the lazy dog
              </SpringText>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">Pangrams</p>
        <div className="flex flex-col gap-4">
          {pangrams.map((text, i) => (
            <SpringText key={i} axes={rf.axes} className="text-2xl sm:text-3xl leading-snug" style={{ fontFamily: rf.css, fontWeight: rf.weight }}>
              {text}
            </SpringText>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">Body text</p>
        <SpringText axes={rf.axes} className="text-base leading-relaxed max-w-prose" style={{ fontFamily: rf.css, fontWeight: rf.weight }}>
          Typography is the art and technique of arranging type to make written language legible, readable and
          appealing when displayed. The arrangement of type involves selecting typefaces, point sizes, line lengths,
          line spacing and letter spacing, as well as adjusting the space between pairs of letters.{" "}
          <em>Italic sits alongside roman</em> and <strong>bold carries emphasis</strong>.
        </SpringText>
      </div>
    </section>
  );
}

export function SpecimenSheet() {
  const { state } = useLab();
  const roles = useRoleFonts(state);
  const [roleParam, setRole] = useParam("role", "heading");
  const role = (ROLES.includes(roleParam as Role) ? roleParam : "heading") as Role;

  return (
    <div className="flex flex-col gap-12">
      <div className="flex gap-2 overflow-x-auto">
        {ROLES.map((r) => (
          <button
            key={r}
            onClick={() => setRole(r)}
            className={cn(
              "px-4 py-2 text-sm rounded-md whitespace-nowrap",
              r === role ? "bg-foreground text-background font-medium" : "text-muted hover:text-foreground border border-border"
            )}
          >
            {LABEL[r]}: {state[r].family}
          </button>
        ))}
      </div>
      <FontSpecimen rf={roles[role]} />
    </div>
  );
}
