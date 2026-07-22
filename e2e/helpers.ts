import { expect, type Page } from '@playwright/test';

/** Wait until a named Phaser scene is active (v8.2 lesson: asset growth lengthens
 *  boot past any fixed wait — poll the scene manager instead of sleeping). */
export async function waitForScene(page: Page, key: string, timeout = 10_000): Promise<void> {
  await expect.poll(async () => page.evaluate((k) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    return g ? g.scene.isActive(k) : false;
  }, key), { timeout }).toBe(true);
}

/** Measurement bot: keeps the run alive for durationMs by hopping the player onto
 *  the nearest platform above every stepMs. Deliberately NOT gameplay-realistic —
 *  it exists because synthetic key-mashing dies organically mid-measurement and
 *  SPACE-retries into a fresh run, silently contaminating any duration/recording
 *  measurement (this burned three separate audits; see HANDOFF v0.18.1).
 *  Use it whenever a test needs an uninterrupted run of known length. */
export async function surviveClimb(page: Page, durationMs: number, stepMs = 400): Promise<void> {
  const t0 = Date.now();
  while (Date.now() - t0 < durationMs) {
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const g = (window as any).__game?.scene?.keys?.Game;
      if (!g?.player?.sprite?.body || g.dead) return;
      const py = g.player.sprite.y as number;
      // PlatformDescriptor: x = left edge, y = top edge (smaller y = higher).
      const above = (g.stream?.active ?? [])
        .filter((p: { y: number }) => p.y < py - 20)
        .sort((a: { y: number }, b: { y: number }) => b.y - a.y)[0];
      if (above) {
        const body = g.player.sprite.body;
        body.reset(above.x + above.width / 2, above.y - 30);
        body.setVelocity(0, 0);
      }
    });
    await page.waitForTimeout(stepMs);
  }
}

/** Robust duration of the share-overlay's <video> (MediaRecorder blobs sometimes
 *  report Infinity until seeked far past the end — the standard workaround). */
export async function clipVideoDuration(page: Page, timeoutMs = 8000): Promise<number> {
  return page.evaluate((tmo) => new Promise<number>((resolve, reject) => {
    const v = document.getElementById('ll-clip') as HTMLVideoElement | null;
    if (!v) { reject(new Error('no #ll-clip')); return; }
    const bail = setTimeout(() => reject(new Error('duration timeout')), tmo);
    const finish = (d: number) => { clearTimeout(bail); resolve(d); };
    const check = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) { finish(v.duration); return; }
      // Infinity workaround: seek far past the end; duration resolves on seeked.
      v.onseeked = () => { if (Number.isFinite(v.duration)) finish(v.duration); };
      v.currentTime = 1e7;
    };
    if (v.readyState >= 1) check(); else v.onloadedmetadata = check;
  }), timeoutMs);
}
