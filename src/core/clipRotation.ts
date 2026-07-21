// src/core/clipRotation.ts
/** Rotation scheduler for the two leapfrogging clip recorders.
 *
 * A MediaRecorder's output is only a valid file from its own start, so a rolling
 * "last 30s" needs two recorders offset by one segment: at any instant the
 * OLDER-running one holds 15-30s of footage ending now. Pure and unit-tested;
 * ClipRecorder applies the returned actions to real MediaRecorders. */

export const SEGMENT_MS = 15_000;

export interface RotationState {
  aStartedAt: number | null;
  bStartedAt: number | null;
}

export type RotationAction = 'startA' | 'stopA' | 'startB' | 'stopB';

export function initialState(): RotationState {
  return { aStartedAt: null, bStartedAt: null };
}

export function advance(s: RotationState, now: number): { state: RotationState; actions: RotationAction[] } {
  let { aStartedAt, bStartedAt } = s;
  const actions: RotationAction[] = [];
  if (aStartedAt === null && bStartedAt === null) {
    aStartedAt = now; actions.push('startA');
  } else if (bStartedAt === null && aStartedAt !== null && now - aStartedAt >= SEGMENT_MS) {
    bStartedAt = now; actions.push('startB');
  } else {
    if (aStartedAt !== null && now - aStartedAt >= SEGMENT_MS * 2) {
      actions.push('stopA', 'startA'); aStartedAt = now;
    }
    if (bStartedAt !== null && now - bStartedAt >= SEGMENT_MS * 2) {
      actions.push('stopB', 'startB'); bStartedAt = now;
    }
  }
  return { state: { aStartedAt, bStartedAt }, actions };
}

/** The recorder whose blob becomes the death clip: the older running one. */
export function pickWinner(s: RotationState, _now: number): 'a' | 'b' | null {
  if (s.aStartedAt === null && s.bStartedAt === null) return null;
  if (s.aStartedAt === null) return 'b';
  if (s.bStartedAt === null) return 'a';
  return s.aStartedAt <= s.bStartedAt ? 'a' : 'b';
}
