export interface ChangelogEntry { version: string; date: string; notes: string[] }

/** Newest-first. Shown in the What's New modal; the top entry auto-pops on version change. */
export const CHANGELOG: ChangelogEntry[] = [
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
