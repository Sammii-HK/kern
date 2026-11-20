"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { ThemeToggle } from "./theme-toggle";
import { FontThumb } from "./font-thumb";
import { cn } from "@/lib/utils";
import { systemQuery } from "@/lib/lab-state";
import { useLab } from "@/hooks/use-lab";

const links = [
  { href: "/", label: "Browse" },
  { href: "/pairing", label: "Pairing" },
  { href: "/type-scale", label: "Scale" },
  { href: "/playground", label: "Playground" },
  { href: "/specimen", label: "Specimen" },
  { href: "/export", label: "Export" },
];

export function Nav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useLab();
  // Links carry the system (fonts, axes, scale) but not page-local state.
  const query = systemQuery(new URLSearchParams(searchParams.toString()));

  return (
    <nav aria-label="Primary navigation" className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
      <div className="type-lab-nav max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="type-lab-primary flex items-center gap-6 min-w-0">
          <Link href={`/${query}`} className="type-lab-brand text-lg font-semibold tracking-tight shrink-0">
            Type Lab
          </Link>
          <div className="type-lab-links flex items-center gap-1 overflow-x-auto scrollbar-none">
            {links.map((link) => (
              <Link
                key={link.href}
                href={`${link.href}${query}`}
                aria-current={pathname === link.href ? "page" : undefined}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-md transition-colors whitespace-nowrap",
                  pathname === link.href
                    ? "bg-foreground text-background font-medium"
                    : "text-muted hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="type-lab-tools flex items-center gap-3 shrink-0">
          <div
            className="hidden lg:flex items-baseline gap-2 text-sm text-muted"
            aria-label="Current system"
            data-testid="system-summary"
          >
            <FontThumb family={state.heading.family} className="text-foreground" />
            <span>/</span>
            <FontThumb family={state.body.family} />
            <span>/</span>
            <FontThumb family={state.mono.family} />
          </div>
          <ThemeToggle />
        </div>
      </div>
    </nav>
  );
}
