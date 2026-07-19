import { animKey, frameKey, CLIMBER_CHARACTER, type PlayerState } from './core/characters';

export interface AnimDef {
  key: string;
  frames: Array<string | number>;
  frameRate: number;
  repeat: number;
  sheetKey?: string;
}

const STATE_DEFS: { state: PlayerState; frames: string[]; frameRate: number; repeat: number }[] = [
  { state: 'run',  frames: ['run-0', 'run-1', 'run-2', 'run-3', 'run-4', 'run-5'], frameRate: 10, repeat: -1 },
  { state: 'jump', frames: ['jump-1', 'jump-2', 'jump-3'], frameRate: 12, repeat: 0 },
  { state: 'fall', frames: ['jump-4', 'jump-5'], frameRate: 8, repeat: 0 },
  { state: 'idle', frames: ['idle-0', 'idle-1', 'idle-2', 'idle-3'], frameRate: 6, repeat: -1 },
];

// Full master-preserved Climber atlas order: idle, run, jump, fall, land,
// double jump, dash, wall slide, wall jump, climb, crouch, hurt, death.
const CLIMBER_STATE_DEFS: { state: PlayerState; frames: number[]; frameRate: number; repeat: number }[] = [
  { state: 'idle',        frames: [0, 1, 2, 3, 4, 5], frameRate: 6, repeat: -1 },
  { state: 'run',         frames: [6, 7, 8, 9, 10, 11], frameRate: 10, repeat: -1 },
  { state: 'jump',        frames: [12, 13, 14], frameRate: 8, repeat: 0 },
  { state: 'fall',        frames: [15, 16], frameRate: 8, repeat: 0 },
  { state: 'land',        frames: [17, 18, 19], frameRate: 10, repeat: 0 },
  { state: 'double_jump', frames: [20, 21, 22, 23], frameRate: 10, repeat: 0 },
  { state: 'dash',        frames: [24, 25, 26, 27], frameRate: 14, repeat: -1 },
  { state: 'wall_slide',  frames: [28, 29, 30, 31], frameRate: 7, repeat: -1 },
  { state: 'wall_jump',   frames: [32, 33, 34, 35], frameRate: 10, repeat: 0 },
  { state: 'climb',       frames: [36, 37, 38, 39, 40], frameRate: 7, repeat: -1 },
  { state: 'crouch',      frames: [41, 42], frameRate: 5, repeat: -1 },
  { state: 'hurt',        frames: [43, 44, 45, 46], frameRate: 9, repeat: 0 },
  { state: 'death',       frames: [47, 48, 49, 50], frameRate: 6, repeat: 0 },
];

export function characterAnims(id: string): AnimDef[] {
  if (id === CLIMBER_CHARACTER) {
    return CLIMBER_STATE_DEFS.map((s) => ({
      key: animKey(id, s.state),
      frames: s.frames,
      frameRate: s.frameRate,
      repeat: s.repeat,
      sheetKey: 'climber-sheet',
    }));
  }
  return STATE_DEFS.map((s) => ({
    key: animKey(id, s.state),
    frames: s.frames.map((f) => frameKey(id, f)),
    frameRate: s.frameRate,
    repeat: s.repeat,
  }));
}
