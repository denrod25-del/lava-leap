import { test, expect } from '@playwright/test';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

/**
 * Tap the Menu's tap-to-start zone and wait for the Game scene's player to
 * actually exist, retrying the tap a few times. Under parallel-worker CPU
 * contention a single tap can land before Phaser's pointer plugin has bound
 * listeners for the frame (unlike a keyboard keydown, which Phaser's input
 * plugin picks up off the DOM event directly), so the run silently never
 * starts. Polling instead of a longer fixed wait keeps this deterministic
 * without weakening the eventual assertions.
 */
async function startRunByTap(page: import('@playwright/test').Page, box: { x: number; y: number; width: number; height: number }): Promise<void> {
  for (let attempt = 0; attempt < 5; attempt++) {
    await page.touchscreen.tap(box.x + box.width / 2, box.y + box.height * 0.3);
    await page.waitForTimeout(400);
    const started = await page.evaluate(() => {
      const g = (window as unknown as { __game?: { scene: { keys: Record<string, unknown> } } }).__game;
      const s = g?.scene.keys['Game'] as { player?: unknown } | undefined;
      return !!s?.player;
    });
    if (started) return;
  }
  throw new Error('run never started: tap-to-start zone did not produce a Game scene player after 5 attempts');
}

test.describe('auto controls (touch)', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('AUTO is the touch default: bounces, taps dash, flow rises', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('lavaleap.save.v2', JSON.stringify({
        version: 2, tutorialDone: true, lastSeenVersion: '0.8.2', // suppress popups; scheme omitted → backfills 'auto'
      }));
    });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(1500);

    const box = (await page.locator('canvas').boundingBox())!;
    // The Menu's tap-to-start zone only covers the top half of the canvas
    // (a 600x365 rectangle over a 600x720 canvas); tapping lower lands on
    // dead space and the run never starts. 0.3 stays inside that zone.
    await startRunByTap(page, box);
    await page.waitForTimeout(400);

    // Auto mode active?
    const auto = await page.evaluate(() => {
      const g = (window as unknown as { __game?: { scene: { keys: Record<string, unknown> } } }).__game;
      const s = g?.scene.keys['Game'] as { player?: { autoJump?: boolean } } | undefined;
      return s?.player?.autoJump;
    });
    expect(auto, 'auto scheme should be the touch default').toBe(true);

    // Taps → dashes (the player is airborne almost constantly under auto-jump).
    for (let i = 0; i < 6; i++) {
      await page.touchscreen.tap(box.x + box.width * 0.5, box.y + box.height * 0.5);
      await page.waitForTimeout(300);
    }

    const flow = await page.evaluate(() => {
      const g = (window as unknown as { __game?: { registry: { get(k: string): unknown } } }).__game;
      return g?.registry.get('flow') as { value: number } | undefined;
    });
    expect(flow, 'flow registry missing').toBeTruthy();
    expect(flow!.value).toBeGreaterThan(0);
    expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
  });

  test('MANUAL stays selectable via the save', async ({ page }) => {
    const errors = collectErrors(page);
    await page.addInitScript(() => {
      localStorage.setItem('lavaleap.save.v2', JSON.stringify({
        version: 2, tutorialDone: true, lastSeenVersion: '0.8.2',
        settings: { musicVol: 7, sfxVol: 7, screenShake: true, reducedMotion: false, controlScheme: 'manual' },
      }));
    });
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(1500);
    const box = (await page.locator('canvas').boundingBox())!;
    // Same tap-to-start zone constraint as the AUTO test above.
    await startRunByTap(page, box);
    await page.waitForTimeout(400);
    const auto = await page.evaluate(() => {
      const g = (window as unknown as { __game?: { scene: { keys: Record<string, unknown> } } }).__game;
      const s = g?.scene.keys['Game'] as { player?: { autoJump?: boolean } } | undefined;
      return s?.player?.autoJump;
    });
    expect(auto, 'manual scheme must not enable autoJump').toBe(false);
    expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
  });
});
