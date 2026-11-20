"use client";

import { createElement, type CSSProperties, type ReactNode } from "react";
import { useSpringVariations } from "@/hooks/use-spring-variations";

interface SpringTextProps {
  as?: "p" | "div" | "span" | "h1" | "h2" | "h3";
  axes: Record<string, number>;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
  contentEditable?: boolean;
}

/** Text whose variable-font axes move on a spring when they change. */
export function SpringText({ as = "p", axes, className, style, children, contentEditable }: SpringTextProps) {
  const ref = useSpringVariations<HTMLElement>(axes);
  return createElement(
    as,
    {
      ref,
      className,
      style,
      contentEditable,
      suppressContentEditableWarning: contentEditable,
      spellCheck: contentEditable ? false : undefined,
    },
    children
  );
}
