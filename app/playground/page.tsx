"use client";

import { Suspense, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  fonts,
  getFontByName,
  getDefaultAxisValues,
  buildFontVariationSettings,
} from "@/lib/fonts";
import { AxisPanel } from "@/components/axis-panel";
import { FontSelector } from "@/components/font-selector";
import { FontPreview } from "@/components/font-preview";
import { OpticalSizeDemo } from "@/components/optical-size-demo";
import { ComparisonView } from "@/components/comparison-view";
import { CopyButton } from "@/components/copy-button";
import { ColourPicker } from "@/components/colour-picker";
import { cn } from "@/lib/utils";

type Mode = "single" | "compare";

export default function PlaygroundPage() {
  return (
    <Suspense fallback={<div className="p-8 text-muted">Loading playground...</div>}>
      <PlaygroundContent />
    </Suspense>
  );
}

function PlaygroundContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFont = getFontByName(searchParams.get("font") ?? "") ?? fonts[0];
  const [selectedFont, setSelectedFont] = useState(initialFont);
  const [mode, setMode] = useState<Mode>("single");
  const [fontSize, setFontSize] = useState(
    Number(searchParams.get("size")) || 48
  );
  const [textColour, setTextColour] = useState(
    searchParams.get("color") ?? ""
  );
  const [bgColour, setBgColour] = useState(searchParams.get("bg") ?? "");

  // Parse axis values from URL or use defaults
  const parseInitialAxes = () => {
    const defaults = getDefaultAxisValues(initialFont.axes);
    for (const axis of initialFont.axes) {
      const urlVal = searchParams.get(axis.tag);
      if (urlVal) defaults[axis.tag] = Number(urlVal);
    }
    return defaults;
  };

  const [axisValues, setAxisValues] = useState(parseInitialAxes);

  // Sync state to URL
  const syncUrl = useCallback(
    (font: string, axes: Record<string, number>, size: number) => {
      const params = new URLSearchParams();
      params.set("font", font);
      params.set("size", String(size));
      for (const [tag, val] of Object.entries(axes)) {
        params.set(tag, String(val));
      }
      if (textColour) params.set("color", textColour);
      if (bgColour) params.set("bg", bgColour);
      router.replace(`/playground?${params.toString()}`, { scroll: false });
    },
    [router, textColour, bgColour]
  );

  const handleAxisChange = useCallback(
    (tag: string, value: number) => {
      setAxisValues((prev) => {
        const next = { ...prev, [tag]: value };
        syncUrl(selectedFont.name, next, fontSize);
        return next;
      });
    },
    [selectedFont.name, fontSize, syncUrl]
  );

  const handleFontChange = useCallback(
    (name: string) => {
      const font = getFontByName(name) ?? fonts[0];
      setSelectedFont(font);
      const defaults = getDefaultAxisValues(font.axes);
      setAxisValues(defaults);
      syncUrl(name, defaults, fontSize);
    },
    [fontSize, syncUrl]
  );

  const handleReset = useCallback(() => {
    const defaults = getDefaultAxisValues(selectedFont.axes);
    setAxisValues(defaults);
    setFontSize(48);
    syncUrl(selectedFont.name, defaults, 48);
  }, [selectedFont, syncUrl]);

  const cssSnippet = `font-family: "${selectedFont.name}", ${
    selectedFont.name === "Fraunces" ? "serif" : "sans-serif"
  };
font-variation-settings: ${buildFontVariationSettings(
    selectedFont.axes,
    axisValues
  )};
font-size: ${fontSize}px;`;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
          Playground
        </h1>
        <p className="text-muted text-sm max-w-lg">
          Manipulate variable font axes in real time. Edit the preview text,
          adjust sliders, and copy the CSS output.
        </p>
      </div>

      {/* Mode toggle */}
      <div className="flex items-center gap-3">
        {(["single", "compare"] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={cn(
              "px-3 py-1.5 text-sm rounded-md transition-colors capitalize",
              mode === m
                ? "bg-foreground text-background font-medium"
                : "text-muted hover:text-foreground border border-border"
            )}
          >
            {m === "single" ? "Single font" : "Compare"}
          </button>
        ))}
      </div>

      {mode === "compare" ? (
        <ComparisonView />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar */}
          <aside className="flex flex-col gap-6 lg:sticky lg:top-20 lg:self-start">
            <FontSelector
              selected={selectedFont.name}
              onChange={handleFontChange}
            />
            <AxisPanel
              font={selectedFont}
              values={axisValues}
              onChange={handleAxisChange}
              onReset={handleReset}
            />

            {/* Font size */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between text-xs">
                <label className="text-muted uppercase tracking-wider font-medium">
                  Font size
                </label>
                <span className="tabular-nums font-medium">{fontSize}px</span>
              </div>
              <input
                type="range"
                min={12}
                max={200}
                value={fontSize}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setFontSize(v);
                  syncUrl(selectedFont.name, axisValues, v);
                }}
                className="w-full"
              />
            </div>

            <ColourPicker
              textColour={textColour}
              bgColour={bgColour}
              onTextChange={setTextColour}
              onBgChange={setBgColour}
            />

            <CopyButton text={cssSnippet} />
          </aside>

          {/* Main */}
          <div className="flex flex-col gap-6">
            <FontPreview
              font={selectedFont}
              axisValues={axisValues}
              fontSize={fontSize}
              textColour={textColour || undefined}
              bgColour={bgColour || undefined}
            />
            <OpticalSizeDemo font={selectedFont} axisValues={axisValues} />

            {/* CSS output */}
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-xs uppercase tracking-wider text-muted font-medium">
                  CSS Output
                </h4>
                <CopyButton text={cssSnippet} />
              </div>
              <pre className="text-sm font-mono text-foreground/80 whitespace-pre-wrap">
                {cssSnippet}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
