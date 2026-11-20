"use client";

import { useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { DEFAULT_SPRING, isSettled, stepSpring, type SpringConfig, type SpringState } from "@/lib/spring";
import { fvsString } from "@/lib/axes";

/**
 * Animates an element's font-variation-settings towards `target` on a spring,
 * one requestAnimationFrame loop per element, writing straight to the DOM so
 * React does not re-render on every frame. With prefers-reduced-motion the
 * glyphs jump to the new values instead.
 */
export function useSpringVariations<T extends HTMLElement>(
  target: Record<string, number>,
  config: SpringConfig = DEFAULT_SPRING
) {
  const ref = useRef<T>(null);
  const springs = useRef<Record<string, SpringState>>({});
  const targetRef = useRef(target);
  const frame = useRef<number | null>(null);
  const last = useRef(0);
  const reduced = useReducedMotion();
  const key = fvsString(target);

  useLayoutEffect(() => {
    targetRef.current = target;
    const el = ref.current;
    if (!el) return;

    const s = springs.current;
    for (const tag of Object.keys(s)) if (!(tag in target)) delete s[tag];
    for (const [tag, v] of Object.entries(target)) if (!s[tag]) s[tag] = { x: v, v: 0 };

    const write = () => {
      const values: Record<string, number> = {};
      for (const [tag, st] of Object.entries(s)) values[tag] = st.x;
      el.style.fontVariationSettings = fvsString(values);
    };

    if (reduced) {
      for (const [tag, v] of Object.entries(target)) s[tag] = { x: v, v: 0 };
      write();
      return;
    }

    const tick = (now: number) => {
      const dt = last.current ? (now - last.current) / 1000 : 1 / 60;
      last.current = now;
      let settled = true;
      for (const [tag, goal] of Object.entries(targetRef.current)) {
        const next = stepSpring(s[tag], goal, dt, config);
        if (isSettled(next, goal, Math.abs(goal) || 1)) s[tag] = { x: goal, v: 0 };
        else {
          s[tag] = next;
          settled = false;
        }
      }
      write();
      frame.current = settled ? null : requestAnimationFrame(tick);
    };

    write();
    if (frame.current === null) {
      last.current = 0;
      frame.current = requestAnimationFrame(tick);
    }
  }, [key, reduced]); // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(
    () => () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current);
      frame.current = null;
    },
    []
  );

  return ref;
}
