"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { CATEGORIES, type Category, type Family } from "@/lib/catalogue/types";
import { useCatalogue } from "@/hooks/use-catalogue";
import { useParam } from "@/hooks/use-lab";
import { FontThumb } from "./font-thumb";
import { FamilyDetail } from "./family-detail";
import { cn } from "@/lib/utils";

const PAGE = 60;
type Sort = "popular" | "name" | "axes";

export interface BrowseFilters {
  query: string;
  categories: Category[];
  variable: boolean;
  opsz: boolean;
  sort: Sort;
}

export function filterFamilies(families: Family[], f: BrowseFilters): Family[] {
  const q = f.query.trim().toLowerCase();
  const out = families.filter(
    (fam) =>
      (!q || fam.family.toLowerCase().includes(q)) &&
      (f.categories.length === 0 || f.categories.includes(fam.category) || (f.categories.includes("monospace") && fam.mono)) &&
      (!f.variable || fam.axes.length > 0) &&
      (!f.opsz || fam.axes.some((a) => a.tag === "opsz"))
  );
  if (f.sort === "name") out.sort((a, b) => a.family.localeCompare(b.family));
  else if (f.sort === "axes") out.sort((a, b) => b.axes.length - a.axes.length || a.popularity - b.popularity);
  return out;
}

function Toggle({ on, onClick, children, testId }: { on: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      data-testid={testId}
      className={cn(
        "px-3 py-1.5 text-xs rounded-full border transition-colors whitespace-nowrap",
        on ? "bg-foreground text-background border-foreground" : "border-border text-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

export function Browser() {
  const { catalogue, error } = useCatalogue();
  const [query, setQuery] = useParam("q");
  const [cat, setCat] = useParam("cat");
  const [variable, setVariable] = useParam("var");
  const [opsz, setOpsz] = useParam("opsz");
  const [sort, setSort] = useParam("sort", "popular");
  const [selected, setSelected] = useParam("f");
  const [shown, setShown] = useState(PAGE);

  const categories = cat ? (cat.split(",") as Category[]) : [];
  const filters: BrowseFilters = {
    query,
    categories,
    variable: variable === "1",
    opsz: opsz === "1",
    sort: sort as Sort,
  };

  const results = useMemo(
    () => (catalogue ? filterFamilies(catalogue.families, filters) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogue, query, cat, variable, opsz, sort]
  );
  const visible = results.slice(0, shown);
  const selectedFamily = catalogue?.families.find((f) => f.family === selected);
  const variableCount = catalogue?.families.filter((f) => f.axes.length).length ?? 0;

  const toggleCategory = (id: Category) => {
    const next = categories.includes(id) ? categories.filter((c) => c !== id) : [...categories, id];
    setCat(next.join(","));
    setShown(PAGE);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Browse</h1>
        <p className="text-muted text-sm max-w-xl">
          {catalogue
            ? `${catalogue.families.length.toLocaleString("en-GB")} Google Fonts families, ${variableCount} of them variable. Axis controls are generated from each family's metadata.`
            : "Loading the Google Fonts catalogue…"}
          {catalogue?.source === "snapshot" && " Showing the bundled snapshot while the live catalogue loads."}
        </p>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>

      <div className="flex flex-col gap-3">
        <label className="relative max-w-md">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="search"
            data-testid="browse-search"
            aria-label="Search families"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setShown(PAGE);
            }}
            placeholder="Search families"
            className="w-full bg-surface border border-border rounded-md pl-9 pr-3 py-2 text-sm"
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map((c) => (
            <Toggle key={c.id} on={categories.includes(c.id)} onClick={() => toggleCategory(c.id)}>
              {c.label}
            </Toggle>
          ))}
          <span className="w-px h-5 bg-border mx-1" />
          <Toggle testId="filter-variable" on={filters.variable} onClick={() => setVariable(filters.variable ? "" : "1")}>
            Variable
          </Toggle>
          <Toggle testId="filter-opsz" on={filters.opsz} onClick={() => setOpsz(filters.opsz ? "" : "1")}>
            Has opsz
          </Toggle>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort"
            className="ml-auto bg-surface border border-border rounded-md px-2 py-1.5 text-xs"
          >
            <option value="popular">Most popular</option>
            <option value="name">A to Z</option>
            <option value="axes">Most axes</option>
          </select>
        </div>
        <p className="text-xs text-muted" data-testid="result-count">
          {results.length.toLocaleString("en-GB")} {results.length === 1 ? "family" : "families"}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8 items-start">
        <div className="flex flex-col gap-4">
          <ul className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3" data-testid="family-grid">
            {visible.map((f) => (
              <li key={f.family}>
                <button
                  onClick={() => setSelected(f.family)}
                  data-family={f.family}
                  className={cn(
                    "w-full text-left rounded-lg border p-4 flex flex-col gap-3 h-full transition-colors",
                    selected === f.family ? "border-foreground" : "border-border hover:border-muted"
                  )}
                >
                  <FontThumb family={f.family} className="text-2xl leading-tight truncate max-w-full" />
                  <div className="flex items-center justify-between gap-2 text-[11px] text-muted">
                    <span>
                      {CATEGORIES.find((c) => c.id === f.category)?.label}
                      {f.mono && f.category !== "monospace" ? " · mono" : ""}
                    </span>
                    <span>{f.axes.length ? `${f.axes.length} axis${f.axes.length > 1 ? "es" : ""}` : `${f.weights.length} weight${f.weights.length > 1 ? "s" : ""}`}</span>
                  </div>
                  {f.axes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {f.axes.map((a) => (
                        <span key={a.tag} className="px-1.5 py-0.5 rounded bg-border/60 text-[10px] font-mono">
                          {a.tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </li>
            ))}
          </ul>
          {shown < results.length && (
            <button
              onClick={() => setShown((s) => s + PAGE)}
              className="self-center px-4 py-2 text-sm rounded-md border border-border hover:bg-surface"
            >
              Show more ({(results.length - shown).toLocaleString("en-GB")} left)
            </button>
          )}
        </div>

        <aside className="lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto">
          {selectedFamily ? (
            <FamilyDetail key={selectedFamily.family} family={selectedFamily} registry={catalogue!.axisRegistry} />
          ) : (
            <div className="rounded-lg border border-dashed border-border p-6 text-sm text-muted">
              Pick a family to load it in full, try its axes, and assign it a role in your system.
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
