export interface ChangelogEntry { version: string; date: string; notes: string[] }

/** Newest-first. Shown in the What's New modal; the top entry auto-pops on version change. */
export const CHANGELOG: ChangelogEntry[] = [
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
