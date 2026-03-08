"use client";

import { type FontAxis } from "@/lib/fonts";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

interface AxisSliderProps {
  axis: FontAxis;
  value: number;
  onChange: (tag: string, value: number) => void;
}

export function AxisSlider({ axis, value, onChange }: AxisSliderProps) {
  const springValue = useSpring(value, { stiffness: 300, damping: 30 });
  const displayValue = useTransform(springValue, (v) => Math.round(v));
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    springValue.set(value);
  }, [value, springValue]);

  useEffect(() => {
    const unsub = displayValue.on("change", (v) => {
      if (spanRef.current) spanRef.current.textContent = String(v);
    });
    return unsub;
  }, [displayValue]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs">
        <label className="text-muted uppercase tracking-wider font-medium">
          {axis.name}
          <span className="ml-1.5 text-foreground/40 normal-case tracking-normal">
            {axis.tag}
          </span>
        </label>
        <span ref={spanRef} className="tabular-nums font-medium text-foreground">
          {value}
        </span>
      </div>
      <input
        type="range"
        min={axis.min}
        max={axis.max}
        step={axis.step}
        value={value}
        onChange={(e) => onChange(axis.tag, Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-[10px] text-muted">
        <span>{axis.min}</span>
        <span>{axis.max}</span>
      </div>
    </div>
  );
}
