import Phaser from 'phaser';
import { TUNING } from './tuning';
import { BootScene } from './scenes/BootScene';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { GameOverScene } from './scenes/GameOverScene';
import { ShopScene } from './scenes/ShopScene';
import { AchievementsScene } from './scenes/AchievementsScene';
import { HowToScene } from './scenes/HowToScene';
import { ChangelogScene } from './scenes/ChangelogScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { LeaderboardScene } from './scenes/LeaderboardScene';
import { JournalScene } from './scenes/JournalScene';
import { CutsceneScene } from './scenes/CutsceneScene';
import { LevelSelectScene } from './scenes/LevelSelectScene';
import { MissionsScene } from './scenes/MissionsScene';
import { SaveData } from './core/SaveData';
import { createLeaderboard } from './core/leaderboard';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './core/leaderboardConfig';
import { createTelemetry } from './core/telemetry';
import { setTrackFanout } from './core/track';
import { APP_VERSION } from './core/buildInfo';

/** Single shared save — all scenes import this. */
export const save = new SaveData(window.localStorage);

/** Single shared leaderboard client — disabled (no-op) unless VITE_SUPABASE_* are set. */
export const leaderboard = createLeaderboard({
  url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY, fetchImpl: window.fetch.bind(window),
});

/** Write-only quality telemetry — same env gate as the leaderboard; dormant without it. */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const telemetry = createTelemetry({
  url: SUPABASE_URL,
  anonKey: SUPABASE_ANON_KEY,
  fetchImpl: fetch.bind(globalThis),
  appVersion: APP_VERSION,
  // Lazy: the id is minted on first leaderboard use; send null until it exists.
  playerId: () => {
    const id = save.get().identity.playerId;
    return UUID_RE.test(id) ? id : null;
  },
});
setTrackFanout((e) => {
  const { event, ts: _ts, ...props } = e;
  telemetry.push(String(event), props);
});
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') telemetry.flush();
});

let crashShown = false;
function showCrashOverlay(message: string): void {
  if (crashShown) return;
  crashShown = true;
  const div = document.createElement('div');
  div.style.cssText = 'position:fixed;inset:0;background:#10101a;color:#fff;display:flex;'
    + 'flex-direction:column;align-items:center;justify-content:center;z-index:9999;'
    + 'font-family:monospace;cursor:pointer;text-align:center;padding:20px';
  div.innerHTML = '<div style="font-size:28px;color:#ff7b00;margin-bottom:12px">Something went wrong</div>'
    + '<div style="font-size:16px;margin-bottom:20px">Click anywhere to reload the game.</div>'
    + `<div style="font-size:11px;color:#777;max-width:420px;word-break:break-all">${message}</div>`;
  div.addEventListener('click', () => location.reload());
  document.body.appendChild(div);
}

window.addEventListener('error', (e) => showCrashOverlay(e.message));
window.addEventListener('unhandledrejection', (e) => showCrashOverlay(String(e.reason)));

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#10101a',
  pixelArt: true, // crisp upscaling of the pixel-art sprites
  render: {
    // Keep the WebGL buffer readable between frames: the clip recorder (and any
    // captureStream fallback path) reads the canvas outside the render tick.
    // Without this, timer-sampled captures caught ~9fps of valid frames and
    // clips played fast-forwarded (v0.18.1 encoder fix).
    preserveDrawingBuffer: true,
  },
  scale: {
    mode: Phaser.Scale.FIT, // scale the 480x720 design space up to fill the window
    // The #game flexbox centers the canvas. Phaser's autoCenter would ALSO add
    // centering margins on top of that, double-centering and pushing the canvas
    // off to the right — so we let flex own centering and disable Phaser's.
    autoCenter: Phaser.Scale.NO_CENTER,
    width: TUNING.width,
    height: TUNING.height,
  },
  physics: { default: 'arcade', arcade: { gravity: { x: 0, y: TUNING.gravityY }, debug: false } },
  scene: [BootScene, MenuScene, GameScene, HudScene, GameOverScene, ShopScene, AchievementsScene, HowToScene, ChangelogScene, PauseScene, SettingsScene, LeaderboardScene, JournalScene, CutsceneScene, LevelSelectScene, MissionsScene],
};

// Defensive stale-build protection: this app has no service worker (deliberate),
// so any registration or CacheStorage entry is a leftover from an older deploy
// or another app on the same origin — unregister and clear, non-blocking.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then((regs) => regs.forEach((r) => { void r.unregister(); }))
    .catch(() => { /* unsupported/blocked — nothing to clean */ });
}
if ('caches' in window) {
  caches.keys()
    .then((keys) => keys.forEach((k) => { void caches.delete(k); }))
    .catch(() => { /* unsupported/blocked — nothing to clean */ });
}

const game = new Phaser.Game(config);

// Drop the static HTML pre-loader once Phaser is up (canvas created, first
// scene starting) — BootScene's own progress bar takes over from here.
game.events.once(Phaser.Core.Events.READY, () => {
  const pre = document.getElementById('preloader');
  if (!pre) return;
  pre.classList.add('done'); // CSS opacity fade
  setTimeout(() => pre.remove(), 300);
});

// Dispose the game on HMR so editing source during development doesn't
// stack multiple Phaser.Game instances into #game.
if (import.meta.hot) {
  import.meta.hot.dispose(() => game.destroy(true));
}

// Expose the game in dev for debugging/automated verification (stripped in prod build).
if (import.meta.env.DEV) {
  (window as unknown as { __game: Phaser.Game }).__game = game;
}
