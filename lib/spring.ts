/*
 * A damped spring, integrated with semi-implicit Euler in fixed substeps so
 * the motion is the same at 60Hz and 120Hz.
 */

export interface SpringConfig {
  stiffness: number;
  damping: number;
  mass: number;
}

export const DEFAULT_SPRING: SpringConfig = { stiffness: 180, damping: 24, mass: 1 };

export interface SpringState {
  x: number;
  v: number;
}

const SUBSTEP = 1 / 240;

export function stepSpring(
  state: SpringState,
  target: number,
  dt: number,
  config: SpringConfig = DEFAULT_SPRING
): SpringState {
  let { x, v } = state;
  // Clamp long frames (a background tab) so the spring never explodes.
  let remaining = Math.min(dt, 0.064);
  while (remaining > 0) {
    const h = Math.min(SUBSTEP, remaining);
    const force = -config.stiffness * (x - target) - config.damping * v;
    v += (force / config.mass) * h;
    x += v * h;
    remaining -= h;
  }
  return { x, v };
}

export function isSettled(state: SpringState, target: number, range: number) {
  const eps = Math.max(range, 1) * 1e-4;
  return Math.abs(state.x - target) < eps && Math.abs(state.v) < eps * 10;
}
