export const scaleRatios = {
  "Minor Second": 1.067,
  "Major Second": 1.125,
  "Minor Third": 1.2,
  "Major Third": 1.25,
  "Perfect Fourth": 1.333,
  "Augmented Fourth": 1.414,
  "Perfect Fifth": 1.5,
  "Golden Ratio": 1.618,
} as const;

export type ScaleRatioName = keyof typeof scaleRatios;

export interface ScaleStep {
  label: string;
  rem: number;
  px: number;
  clamp: string;
}

export interface ScaleConfig {
  baseSize: number;
  ratio: number;
  minVw: number;
  maxVw: number;
  steps: number;
}

const stepLabels = [
  "xs", "sm", "base", "lg", "xl", "2xl", "3xl", "4xl", "5xl", "6xl",
];

export function generateScale(config: ScaleConfig): ScaleStep[] {
  const { baseSize, ratio, minVw, maxVw, steps } = config;
  const result: ScaleStep[] = [];
  const baseIndex = 2; // "base" is index 2

  for (let i = 0; i < steps; i++) {
    const exponent = i - baseIndex;
    const size = baseSize * Math.pow(ratio, exponent);
    const minSize = baseSize * Math.pow(ratio, exponent * 0.75);
    const maxSize = size;

    const minRem = minSize / 16;
    const maxRem = maxSize / 16;

    // Generate clamp() value
    // slope = (maxSize - minSize) / (maxVw - minVw)
    const slope = (maxSize - minSize) / (maxVw - minVw);
    const intercept = minSize - slope * minVw;
    const slopeVw = +(slope * 100).toFixed(4);
    const interceptRem = +(intercept / 16).toFixed(4);

    const clamp = `clamp(${minRem.toFixed(4)}rem, ${interceptRem}rem + ${slopeVw}vw, ${maxRem.toFixed(4)}rem)`;

    result.push({
      label: stepLabels[i] ?? `${i - baseIndex}xl`,
      rem: +(maxSize / 16).toFixed(4),
      px: +maxSize.toFixed(1),
      clamp,
    });
  }

  return result;
}

export function generateCssOutput(steps: ScaleStep[]): string {
  const lines = steps.map(
    (step) => `  --font-size-${step.label}: ${step.clamp};`
  );
  return `:root {\n${lines.join("\n")}\n}`;
}
