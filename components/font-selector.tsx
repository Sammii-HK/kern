"use client";

import { fonts } from "@/lib/fonts";
import { cn } from "@/lib/utils";

interface FontSelectorProps {
  selected: string;
  onChange: (name: string) => void;
}

export function FontSelector({ selected, onChange }: FontSelectorProps) {
  return (
    <div className="flex gap-1 p-1 bg-border/50 rounded-lg">
      {fonts.map((font) => (
        <button
          key={font.name}
          onClick={() => onChange(font.name)}
          className={cn(
            "px-3 py-1.5 text-sm rounded-md transition-all",
            selected === font.name
              ? "bg-surface text-foreground shadow-sm font-medium"
              : "text-muted hover:text-foreground"
          )}
        >
          {font.name}
        </button>
      ))}
    </div>
  );
}
