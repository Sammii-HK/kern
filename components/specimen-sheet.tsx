"use client";

import { fonts, buildFontVariationSettings, type FontConfig } from "@/lib/fonts";
import { useState } from "react";

const weights = [100, 200, 300, 400, 500, 600, 700, 800, 900];
const pangrams = [
  "The quick brown fox jumps over the lazy dog",
  "Pack my box with five dozen liquor jugs",
  "How vexingly quick daft zebras jump",
  "Sphinx of black quartz, judge my vow",
];

function FontSpecimen({ font }: { font: FontConfig }) {
  return (
    <section className="flex flex-col gap-8">
      <h2
        className="text-5xl sm:text-7xl font-semibold tracking-tight"
        style={{ fontFamily: font.family }}
      >
        {font.name}
      </h2>

      {/* Alphabet */}
      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">
          Alphabet
        </p>
        <div
          className="text-3xl sm:text-4xl leading-relaxed tracking-wide"
          style={{ fontFamily: font.family }}
        >
          <p>ABCDEFGHIJKLMNOPQRSTUVWXYZ</p>
          <p>abcdefghijklmnopqrstuvwxyz</p>
          <p>0123456789 !@#$%&*(),.;:</p>
        </div>
      </div>

      {/* Weights */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">
          Weights
        </p>
        <div className="flex flex-col gap-2">
          {weights.map((w) => (
            <p
              key={w}
              className="text-xl sm:text-2xl transition-[font-variation-settings] duration-200"
              style={{
                fontFamily: font.family,
                fontVariationSettings: buildFontVariationSettings(font.axes, {
                  wght: w,
                }),
              }}
            >
              <span className="text-xs text-muted tabular-nums w-8 inline-block">
                {w}
              </span>{" "}
              The quick brown fox jumps over the lazy dog
            </p>
          ))}
        </div>
      </div>

      {/* Pangrams */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">
          Pangrams
        </p>
        <div className="flex flex-col gap-4">
          {pangrams.map((text, i) => (
            <p
              key={i}
              className="text-2xl sm:text-3xl leading-snug"
              style={{
                fontFamily: font.family,
                fontVariationSettings: buildFontVariationSettings(font.axes, {
                  wght: 300 + i * 150,
                }),
              }}
            >
              {text}
            </p>
          ))}
        </div>
      </div>

      {/* Paragraph */}
      <div className="flex flex-col gap-3">
        <p className="text-xs uppercase tracking-wider text-muted font-medium">
          Body text
        </p>
        <p
          className="text-base leading-relaxed max-w-prose"
          style={{ fontFamily: font.family }}
        >
          Typography is the art and technique of arranging type to make written
          language legible, readable, and appealing when displayed. The arrangement
          of type involves selecting typefaces, point sizes, line lengths, line
          spacing, and letter spacing, as well as adjusting the space between pairs
          of letters. The term typography is also applied to the style, arrangement,
          and appearance of the letters, numbers, and symbols created by the process.
          Type design is a closely related craft, sometimes considered part of
          typography; most typographers do not design typefaces, and some type
          designers do not consider themselves typographers.
        </p>
      </div>
    </section>
  );
}

export function SpecimenSheet() {
  const [activeFont, setActiveFont] = useState(0);

  return (
    <div className="flex flex-col gap-12">
      <div className="flex gap-2">
        {fonts.map((f, i) => (
          <button
            key={f.name}
            onClick={() => setActiveFont(i)}
            className={`px-4 py-2 text-sm rounded-md transition-colors ${
              i === activeFont
                ? "bg-foreground text-background font-medium"
                : "text-muted hover:text-foreground border border-border"
            }`}
          >
            {f.name}
          </button>
        ))}
      </div>
      <FontSpecimen font={fonts[activeFont]} />
    </div>
  );
}
