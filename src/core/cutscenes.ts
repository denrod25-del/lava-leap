/** Cutscene shot-list content. Framework-free — CutsceneScene is the only
 *  Phaser-aware consumer. A shot is a declarative snapshot: background, actors,
 *  particle bursts, text, camera shake, and SFX, held for `holdMs` before the
 *  next shot (or an input advances it early — CutsceneScene owns that timing). */

export const ACTOR_KEYS = ['ember', 'cole', 'titan', 'spark'] as const;
export type ActorKey = typeof ACTOR_KEYS[number];

export interface ShotActor {
  key: ActorKey;
  x: number;
  y: number;
  /** Multiplier on the actor's base display size (ember/cole 60x80, titan 140x140, spark 16x16). */
  scale?: number;
  flipX?: boolean;
  /** Resting alpha once any tween completes. Default 1. */
  alpha?: number;
  /** Tween FROM these values TO {x,y,alpha} over the shot's holdMs (an entrance). */
  enterFrom?: { x?: number; y?: number; alpha?: number };
  /** Tween FROM {x,y,alpha} TO these values over the shot's holdMs (an exit/move). */
  moveTo?: { x?: number; y?: number; alpha?: number; scale?: number };
}

export interface ShotText {
  content: string;
  y: number;
  sizePx?: number;
  color?: string;
  /** Delay before this line starts fading in, ms. */
  delayMs?: number;
}

export interface ShotBurst { x: number; y: number; count: number; tint: number }

export interface Shot {
  /** Flat near-black background (used for the starfield/finale beats). */
  bg?: 'black';
  /** Per-zone vertical-gradient background (src/core/zones.ts ZONES[index]). */
  bgZone?: 0 | 1 | 2 | 3;
  /** A lava tile strip along the bottom (reuses the globally-loaded 'lava' texture). */
  lavaStrip?: boolean;
  /** Ambient rising embers (the same look as the v0.9.0 opening vignette). */
  particles?: 'embers';
  /** One-shot particle bursts (crack, light-spill, sparkle) fired at shot start. */
  bursts?: ShotBurst[];
  actors?: ShotActor[];
  text?: ShotText[];
  shake?: 'small' | 'big';
  /** Existing sfx-* keys only (see BootScene.preload for the loaded set). */
  sfx?: string[];
  /** How long this shot holds before auto-advancing (ms). */
  holdMs: number;
}

export interface CutsceneDef {
  id: string;
  title: string;
  /** The Keeper's Journal page this cutscene is attached to (▶ Watch row). */
  pageId: string;
  shots: Shot[];
}

export const CUTSCENES: CutsceneDef[] = [
  {
    id: 'opening', title: 'The Choosing', pageId: 'oath',
    shots: [
      { bgZone: 0, particles: 'embers',
        actors: [{ key: 'ember', x: 300, y: 520 }],
        text: [{ content: 'At the foot of the burning mountain,\na village keeps an old promise.', y: 260 }],
        holdMs: 4200 },
      { bgZone: 0, particles: 'embers',
        actors: [
          { key: 'ember', x: 300, y: 520 },
          { key: 'spark', x: 300, y: 480, enterFrom: { x: 300, y: 120, alpha: 0 } },
        ],
        text: [{ content: 'Once a generation, a keeper carries the living spark\nto the summit — to calm the heart\nbefore it burns the sky.', y: 200 }],
        holdMs: 4500 },
      { bgZone: 0,
        actors: [
          { key: 'ember', x: 300, y: 520 },
          { key: 'spark', x: 300, y: 500, scale: 0.6 },
        ],
        bursts: [{ x: 300, y: 500, count: 14, tint: 0xffd166 }],
        text: [{ content: 'The spark has chosen.\nEmber climbs at dawn.', y: 260 }],
        holdMs: 3000 },
      { bgZone: 1, holdMs: 650 },
      { bgZone: 2, holdMs: 650 },
      { bgZone: 3, text: [{ content: '— Climb, keeper.', y: 340, sizePx: 20, color: '#ffd166' }], holdMs: 2200 },
      { bg: 'black',
        text: [
          { content: 'LAVA LEAP', y: 300, sizePx: 32, color: '#ff7b00' },
          { content: 'The Last Ember', y: 340, sizePx: 15, color: '#ffb066', delayMs: 300 },
        ],
        holdMs: 2600 },
    ],
  },
  {
    id: 'keeper-rises', title: 'The Keeper Rises', pageId: 'titan',
    shots: [
      { bgZone: 2, lavaStrip: true, particles: 'embers', holdMs: 2600 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'titan', x: 300, y: 480, enterFrom: { x: 300, y: 760, alpha: 0 } }],
        shake: 'big', sfx: ['sfx-boss-roar'], holdMs: 3200 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'titan', x: 300, y: 480 }],
        text: [{ content: 'He was a keeper once.', y: 580, color: '#ffb066' }],
        holdMs: 2800 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'titan', x: 300, y: 480 }],
        text: [{ content: 'What you fight is the keeping, not the man.', y: 580, color: '#ffb066' }],
        holdMs: 3000 },
    ],
  },
  {
    id: 'freed', title: 'Freed', pageId: 'freed',
    shots: [
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'titan', x: 300, y: 480 }],
        bursts: [{ x: 300, y: 480, count: 20, tint: 0xff7b00 }],
        shake: 'big', sfx: ['sfx-crack'], holdMs: 2400 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'titan', x: 300, y: 480, moveTo: { alpha: 0 } }],
        bursts: [{ x: 300, y: 480, count: 16, tint: 0xffe9c2 }],
        holdMs: 2000 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'cole', x: 300, y: 480, enterFrom: { y: 560, alpha: 0 } }],
        sfx: ['sfx-ding'], holdMs: 3000 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'cole', x: 340, y: 480 }, { key: 'ember', x: 260, y: 480 }],
        text: [{ content: '"How far did I get?"', y: 580, color: '#e8e2d8' }],
        holdMs: 2600 },
      { bgZone: 2, lavaStrip: true,
        actors: [{ key: 'cole', x: 340, y: 480 }, { key: 'ember', x: 260, y: 480 }],
        text: [{ content: 'She told him. He laughed until he cried.', y: 580, color: '#e8e2d8' }],
        holdMs: 2600 },
      { bgZone: 3,
        actors: [{ key: 'ember', x: 260, y: 480 }, { key: 'cole', x: 340, y: 480 }],
        text: [{ content: 'Two keepers face the summit now.', y: 580, color: '#ffb066' }],
        holdMs: 3400 },
    ],
  },
  {
    id: 'summit', title: 'The Summit Waits', pageId: 'summit',
    shots: [
      { bgZone: 3, text: [{ content: 'The book is full.', y: 300, color: '#ffb066' }], holdMs: 2800 },
      { bg: 'black', text: [{ content: 'Above the Crown, the sky goes quiet.', y: 340 }], holdMs: 3200 },
      { bg: 'black', text: [{ content: 'Something up there is waiting for the spark.', y: 340 }], holdMs: 3200 },
      { bg: 'black', text: [{ content: '(To be continued.)', y: 340, sizePx: 18, color: '#8a93a3' }], holdMs: 3200 },
    ],
  },
];

export function cutsceneForPage(pageId: string): CutsceneDef | null {
  return CUTSCENES.find((c) => c.pageId === pageId) ?? null;
}
