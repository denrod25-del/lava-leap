export interface ChangelogEntry { version: string; date: string; notes: string[] }

/** Newest-first. Shown in the What's New modal; the top entry auto-pops on version change. */
export const CHANGELOG: ChangelogEntry[] = [
  { version: '0.11.0', date: '2026-07-14', notes: [
    'LEVELS MODE: a real 4-level campaign — The Magma Vault, The Forge, Ashfall, Obsidian Crown.',
    'Each level ends in a real boss fight; clear one to unlock the next.',
    "Levels bank coins like any run, but don't touch the endless leaderboard — that stays yours to chase separately.",
    'Find it from the Menu (K).',
  ]},
  { version: '0.10.0', date: '2026-07-14', notes: [
    'ANIMATED CUTSCENES: the opening is a real scene now — spark, mountain, and all.',
    'Meet the Lava Titan with a proper cinematic beat, mid-climb, without ever stopping your run.',
    'Freeing Cole finally gets the moment it deserves.',
    'Every story cutscene is replayable forever from the Keeper\'s Journal.',
  ]},
  { version: '0.9.0', date: '2026-07-14', notes: [
    "THE LAST EMBER — Lava Leap has a story. Open the Keeper's Journal (J) from the menu.",
    'Find glowing relics while you climb to unlock the mountain\'s history.',
    'Survive the Lava Titan to FREE THE FALLEN KEEPER — Cole, a new playable character.',
    'New players get a 15-second opening. Veterans: replay it from the Journal.',
  ]},
  { version: '0.8.2', date: '2026-07-07', notes: [
    'Character select! Choose Ember or Classic in the Shop → Characters tab.',
    'Cosmetic tints still stack over whichever hero you pick.',
  ]},
  { version: '0.8.1', date: '2026-07-06', notes: [
    'New hero! Meet your red-capped lava climber — fresh look, same moves.',
  ]},
  { version: '0.8.0', date: '2026-07-06', notes: [
    'GLOBAL LEADERBOARDS: climb the All-Time board and today’s Daily-seed board.',
    'Auto-submits your best runs; pick a name in Settings → NAME.',
    'Everyone plays the same Daily mountain — who climbs it highest?',
  ]},
  { version: '0.7.0', date: '2026-07-06', notes: [
    'NEW DEFAULT mobile controls: AUTO-JUMP — hold anywhere to steer, jumping is automatic.',
    'TAP to dash · tap mid-dash to LAUNCH — the whole FLOW game, one-handed.',
    'Prefer the two-thumb controls? Settings → CONTROLS → MANUAL.',
  ]},
  { version: '0.6.0', date: '2026-07-05', notes: [
    'DASH-FLOW: jump mid-dash to launch and keep your speed — the new signature move.',
    'Dash through danger: enemies and fireballs can\'t touch you mid-dash (lava still wins).',
    'New FLOW meter: stay airborne and chain dashes, stomps & coins to heat up — Cool → Warm → Hot → Blazing, up to ×2 score.',
    'Coins grabbed mid-air now refresh your dash. Chain across the whole screen.',
  ]},
  { version: '0.5.3', date: '2026-07-02', notes: [
    'Reduce Motion setting — turns off camera shake and the death slow-mo.',
    'The lava now glows: a heat haze rises off the surface.',
    'Title screen tagline: Jump fast. Climb higher. Don\'t let the lava catch you.',
  ]},
  { version: '0.5.2', date: '2026-07-02', notes: [
    'Instant lava-themed loading screen with live build info, shown before the game boots.',
    'The page now carries readable content for search engines and no-JS visitors.',
    'Automatic cleanup of any stale offline caches left by older versions.',
  ]},
  { version: '0.5.1', date: '2026-07-02', notes: [
    'Visible build/version label on the title screen and in Settings.',
    'This "What\'s New" screen — auto-shown once when the game updates.',
    'Web build is now deployable with proper cache headers.',
  ]},
  { version: '0.5.0', date: '2026-07-02', notes: [
    'First-run tutorial and a How to Play screen.',
    'Polished title screen; fast fall (hold down / pull the stick down).',
    'Loading screen, sharper share previews, lava bubbles.',
  ]},
  { version: '0.4.x', date: '2026-06-23', notes: [
    'Two-thumb mobile controls: run stick + tap to jump, triple jump.',
    'Fixed jumping while running (multi-touch).',
  ]},
];
