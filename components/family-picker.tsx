"use client";

import { useId, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { Family } from "@/lib/catalogue/types";
import { useCatalogue } from "@/hooks/use-catalogue";
import { FontThumb } from "./font-thumb";
import { cn } from "@/lib/utils";

interface FamilyPickerProps {
  label: string;
  value: string;
  onChange: (family: string) => void;
  filter?: (f: Family) => boolean;
  testId?: string;
}

export function searchFamilies(families: Family[], query: string, limit = 40) {
  const q = query.trim().toLowerCase();
  if (!q) return families.slice(0, limit);
  const starts: Family[] = [];
  const contains: Family[] = [];
  for (const f of families) {
    const name = f.family.toLowerCase();
    if (name.startsWith(q)) starts.push(f);
    else if (name.includes(q)) contains.push(f);
    if (starts.length >= limit) break;
  }
  return [...starts, ...contains].slice(0, limit);
}

/** A searchable combobox over the catalogue. */
export function FamilyPicker({ label, value, onChange, filter, testId }: FamilyPickerProps) {
  const { catalogue } = useCatalogue();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listId = useId();

  const results = useMemo(() => {
    const all = catalogue?.families ?? [];
    return searchFamilies(filter ? all.filter(filter) : all, query, 30);
  }, [catalogue, filter, query]);

  const choose = (family: string) => {
    onChange(family);
    setOpen(false);
    setQuery("");
    inputRef.current?.blur();
  };

  return (
    <div className="relative flex flex-col gap-1.5">
      <span className="text-xs text-muted uppercase tracking-wider font-medium">{label}</span>
      <div className="relative">
        <input
          ref={inputRef}
          data-testid={testId}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-label={`${label} family`}
          value={open ? query : value}
          placeholder={value}
          onFocus={() => {
            setOpen(true);
            setActive(0);
          }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setActive((a) => Math.min(results.length - 1, a + 1));
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setActive((a) => Math.max(0, a - 1));
            } else if (e.key === "Enter" && results[active]) {
              e.preventDefault();
              choose(results[active].family);
            } else if (e.key === "Escape") {
              setOpen(false);
              inputRef.current?.blur();
            }
          }}
          className="w-full bg-surface border border-border rounded-md pl-3 pr-8 py-1.5 text-sm"
        />
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
      </div>
      {open && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-40 top-full mt-1 w-full max-h-72 overflow-y-auto rounded-md border border-border bg-surface shadow-lg py-1"
        >
          {results.length === 0 && <li className="px-3 py-2 text-xs text-muted">No families match.</li>}
          {results.map((f, i) => (
            <li
              key={f.family}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(f.family);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn(
                "px-3 py-1.5 cursor-pointer flex items-baseline justify-between gap-2",
                i === active && "bg-border/60"
              )}
            >
              <FontThumb family={f.family} className="text-base truncate" />
              <span className="text-[10px] text-muted shrink-0">{f.axes.length ? "variable" : `${f.weights.length}w`}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
