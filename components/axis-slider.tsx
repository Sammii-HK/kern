"use client";

interface AxisSliderProps {
  tag: string;
  name: string;
  description?: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
  /** Optional control rendered beside the label, such as an "auto" toggle. */
  aside?: React.ReactNode;
  disabled?: boolean;
}

function format(n: number, step: number) {
  const places = step >= 1 ? 0 : Math.min(3, Math.ceil(-Math.log10(step)));
  return n.toFixed(places);
}

export function AxisSlider({
  tag,
  name,
  description,
  min,
  max,
  step,
  value,
  onChange,
  aside,
  disabled,
}: AxisSliderProps) {
  const id = `axis-${tag}`;
  return (
    <div className="flex flex-col gap-1.5" title={description}>
      <div className="flex items-center justify-between gap-2 text-xs">
        <label htmlFor={id} className="text-muted uppercase tracking-wider font-medium truncate">
          {name}
          <span className="ml-1.5 text-foreground/40 normal-case tracking-normal font-mono">{tag}</span>
        </label>
        <div className="flex items-center gap-2 shrink-0">
          {aside}
          <span className="tabular-nums font-medium text-foreground">
            {disabled ? "auto" : format(value, step)}
          </span>
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full disabled:opacity-40"
      />
      <div className="flex justify-between text-[10px] text-muted tabular-nums">
        <span>{format(min, step)}</span>
        <span>{format(max, step)}</span>
      </div>
    </div>
  );
}
