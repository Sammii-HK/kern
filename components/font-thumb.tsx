"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { loadThumbnail } from "@/lib/font-loader";
import { cn } from "@/lib/utils";

interface FontThumbProps {
  family: string;
  text?: string;
  className?: string;
}

/**
 * Renders `text` (the family name by default) in a text-only subset of the
 * family, fetched when the thumbnail scrolls into view.
 */
export function FontThumb({ family, text = family, className }: FontThumbProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [alias, setAlias] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        observer.disconnect();
        // Include x and H so the same subset can be measured for pairing.
        loadThumbnail(family, `${text}xH`).then((a) => {
          if (cancelled) return;
          if (a) setAlias(a);
          else setFailed(true);
        });
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [family, text]);

  return (
    <motion.span
      ref={ref}
      className={cn("inline-block", className)}
      initial={false}
      animate={{ opacity: alias || failed ? 1 : 0.3 }}
      transition={{ type: "spring", stiffness: 200, damping: 30 }}
      style={{ fontFamily: alias ? `"${alias}", system-ui` : "system-ui" }}
    >
      {text}
    </motion.span>
  );
}
