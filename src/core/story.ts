/** "The Last Ember" — ALL narrative content lives here. Framework-free.
 *  Editing the story = editing this file; the StoryProgress engine and the
 *  scenes render whatever is defined here. */

export type UnlockType = 'start' | 'height' | 'relic' | 'titanReach' | 'titanDefeat' | 'allPages';

export interface StoryPage {
  id: string;
  title: string;
  text: string;
  /** Shown on the locked silhouette row: how to earn this page. */
  hint: string;
  /** Relic pages only: the one-line mid-run toast when the relic is grabbed. */
  whisper?: string;
  unlock: { type: UnlockType; value?: number };
}

/** Game-over beat stages, derived from unlock state (see StoryProgress.stage()). */
export type StoryStage = 'newKeeper' | 'climbing' | 'titanSeen' | 'freed' | 'complete';

/** Page unlocked when the Titan is survived — also frees Cole into the roster. */
export const COLE_PAGE_ID = 'freed';

/** Relic spawn cadence: first at this height, then one per everyPx climbed. */
export const RELIC = { firstAtHeight: 200, everyPx: 500 } as const;

export const STORY_PAGES: StoryPage[] = [
  { id: 'oath', title: "The Keeper's Oath", unlock: { type: 'start' },
    hint: 'Watch the opening (Journal → Replay the opening).',
    text: 'Carry the spark. Outrun the heart\'s anger. Do not look down for long.\n\nThe oath is three lines. Ember learned it before she learned to read.' },
  { id: 'first-climb', title: 'First Steps', unlock: { type: 'height', value: 250 },
    hint: 'Climb to 250.',
    text: 'Every keeper remembers their first two hundred steps. The village watches until the smoke swallows you.\n\nThen you climb for yourself.' },
  { id: 'chosen', title: 'The Youngest Keeper', unlock: { type: 'height', value: 750 },
    hint: 'Climb to 750.',
    text: 'They chose her because the spark chose first.\n\nIt sat in her hands like a warm bird and would not go to anyone else.' },
  { id: 'vault-1', title: 'The Magma Vault', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…doorways still stand, and they remember their names…',
    text: 'The Vault was the first village, before the heat rose. Doorways still stand in the rock.\n\nThe keepers greet them by name as they pass.' },
  { id: 'vault-2', title: 'What the Rock Keeps', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…what the lava takes, the rock keeps…',
    text: 'Nothing burns in the Vault twice. What the lava takes, the rock remembers —\n\na chair, a ladder, a cradle, printed in stone.' },
  { id: 'forge-1', title: 'The Forge', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…the mountain made its own tools once…',
    text: 'Here the mountain made its own tools. Bridges of cooled iron, hammered by pressure alone.\n\nThe keepers call it proof the mountain once meant well.' },
  { id: 'forge-2', title: "Keeper's Steel", unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…Forge-iron, polished bright by falling…',
    text: 'Cole\'s buckle was Forge-iron. They found it years later, half a mountain lower, polished bright by falling.\n\nHis mother kept it by the door.' },
  { id: 'ashfall-1', title: 'Ashfall', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…the ash falls upward here…',
    text: 'Past the Forge the air turns grey and soft. Ash falls upward here, drawn to the heart.\n\nThe old keepers said it was the mountain breathing in.' },
  { id: 'ashfall-2', title: 'The Grey Garden', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…pale ferns that eat heat…',
    text: 'Things grow in Ashfall that grow nowhere else — pale ferns that eat heat.\n\nKeepers leave a sprig at the boundary. For luck. For the ones who stopped here.' },
  { id: 'crown-1', title: 'The Obsidian Crown', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…the glass shows you yourself, climbing…',
    text: 'The summit\'s shoulder is black glass. It reflects your climb back at you —\n\nevery keeper meets themselves in the Crown and must keep climbing anyway.' },
  { id: 'crown-2', title: 'The Last Mile', unlock: { type: 'relic' },
    hint: 'Find a glowing relic while climbing.',
    whisper: '…the pages end where the glass begins…',
    text: 'No keeper has written of the summit itself. The journal pages end where the glass begins.\n\nSomeone should finish the book.' },
  { id: 'titan', title: 'The Fallen Keeper', unlock: { type: 'titanReach' },
    hint: 'Climb high enough to meet the Lava Titan.',
    text: 'He was the strongest climber of his era. The mountain did not defeat him — it kept him.\n\nWhat you fight is the keeping, not the man.' },
  { id: 'freed', title: 'Freed', unlock: { type: 'titanDefeat' },
    hint: "Survive the Lava Titan's assault.",
    text: 'The shell cracked and a man stepped out of the monster, blinking at a sky he\'d forgotten.\n\n"How far did I get?" he asked. She told him. He laughed until he cried.' },
  { id: 'summit', title: 'The Summit Waits', unlock: { type: 'allPages' },
    hint: 'Unlock every other page.',
    text: 'The book is full. The oath is kept — all but the last line.\n\nAbove the Crown the sky goes quiet, and something up there is waiting for the spark.\n\n(To be continued.)' },
];

export const RELIC_PAGE_IDS: string[] =
  STORY_PAGES.filter((p) => p.unlock.type === 'relic').map((p) => p.id);

/** One deterministic line per stage, shown on the Game Over screen. */
export const BEATS: Record<StoryStage, string> = {
  newKeeper: 'The village watches until the smoke swallows you.',
  climbing: 'The mountain remembers you now.',
  titanSeen: 'The Titan watches. He was a keeper once.',
  freed: 'Cole climbs with you now. The mountain feels lighter.',
  complete: 'The book is full. The summit waits.',
};
