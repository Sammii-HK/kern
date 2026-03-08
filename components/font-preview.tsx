"use client";

import { type FontConfig, buildFontVariationSettings } from "@/lib/fonts";

interface FontPreviewProps {
  font: FontConfig;
  axisValues: Record<string, number>;
  fontSize?: number;
  textColour?: string;
  bgColour?: string;
}

export function FontPreview({
  font,
  axisValues,
  fontSize = 48,
  textColour,
  bgColour,
}: FontPreviewProps) {
  const fvs = buildFontVariationSettings(font.axes, axisValues);

  return (
    <div
      className="rounded-lg border border-border p-6 sm:p-8 min-h-[200px] transition-colors"
      style={{ backgroundColor: bgColour }}
    >
      <div
        contentEditable
        suppressContentEditableWarning
        data-placeholder="Type something..."
        className="outline-none w-full break-words leading-[1.2] transition-[font-variation-settings] duration-200 ease-out"
        style={{
          fontFamily: font.family,
          fontVariationSettings: fvs,
          fontSize: `${fontSize}px`,
          color: textColour,
        }}
      >
        The quick brown fox jumps over the lazy dog
      </div>
    </div>
  );
}
