"use client";

import type { RoleFont } from "@/hooks/use-role-fonts";
import { SpringText } from "./spring-text";

interface FontPreviewProps {
  font: Pick<RoleFont, "css" | "axes" | "weight" | "status">;
  fontSize?: number;
  textColour?: string;
  bgColour?: string;
  text?: string;
}

/** Editable sample whose glyphs spring to new axis values. */
export function FontPreview({ font, fontSize = 48, textColour, bgColour, text }: FontPreviewProps) {
  return (
    <div className="rounded-lg border border-border p-6 sm:p-8 min-h-[200px]" style={{ backgroundColor: bgColour }}>
      <SpringText
        as="div"
        axes={font.axes}
        contentEditable
        className="outline-none w-full break-words leading-[1.2]"
        style={{
          fontFamily: font.css,
          fontWeight: font.weight,
          fontSize: `${fontSize}px`,
          color: textColour,
          opacity: font.status === "ready" ? 1 : 0.5,
        }}
      >
        {text ?? "The quick brown fox jumps over the lazy dog"}
      </SpringText>
    </div>
  );
}
