// e2e/clips.spec.ts
import { test, expect } from '@playwright/test';
import { waitForScene, surviveClimb, clipVideoDuration } from './helpers';

const SEED = {
  version: 2, tutorialDone: true, lastSeenVersion: '0.18.1',
  analytics: { runs: 5 },
};

test('a run death produces a shareable clip: SHARE CLIP row + non-empty video in overlay', async ({ page }) => {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify(seed));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');

  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(1500); // let the recorder capture real frames

  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    g.triggerDeath('lava');
  });
  await waitForScene(page, 'GameOver');

  const shareRow = page.locator('canvas'); // Phaser text isn't DOM; drive via keyboard
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const go = (window as any).__game.scene.keys.GameOver;
    return go.children.list.some((c: any) => c.text && String(c.text).includes('SHARE CLIP'));
  }), { timeout: 5000 }).toBe(true);
  void shareRow;

  await page.keyboard.press('KeyC');
  const video = page.locator('#ll-clip');
  await expect(video).toBeVisible();
  await expect.poll(async () => video.evaluate((v: HTMLVideoElement) => v.src.startsWith('blob:')), { timeout: 3000 }).toBe(true);
  // The blob really contains footage.
  const bytes = await page.evaluate(async () => {
    const v = document.getElementById('ll-clip') as HTMLVideoElement;
    const r = await fetch(v.src);
    return (await r.blob()).size;
  });
  expect(bytes).toBeGreaterThan(10_000);
  await page.locator('#ll-clip-close').click();
  await expect(video).toHaveCount(0);
});

test('recordClips=false: no SHARE CLIP row on Game Over', async ({ page }) => {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      ...seed,
      settings: { musicVol: 7, sfxVol: 7, screenShake: true, reducedMotion: false, controlScheme: 'auto', recordClips: false },
    }));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Game.triggerDeath('lava');
  });
  await waitForScene(page, 'GameOver');
  await page.waitForTimeout(800); // give a would-be clipDone time to resolve
  const hasRow = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const go = (window as any).__game.scene.keys.GameOver;
    return go.children.list.some((c: any) => c.text && String(c.text).includes('SHARE CLIP'));
  });
  expect(hasRow).toBe(false);
});

// Encoder regression (v0.18.1): the v0.14 pipeline captured sparse frames that
// Chromium stamped at the nominal rate, so clips played fast-forwarded — and no
// test asserted clip duration vs recording time, so it shipped. This locks it:
// an uninterrupted ~8s run must yield a clip whose duration tracks wall clock.
test('clip duration tracks wall-clock recording time (encoder regression)', async ({ page }) => {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify(seed));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  const tRecStart = Date.now(); // recorder starts at scene create, just before this
  await page.waitForTimeout(500);
  await surviveClimb(page, 8000);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Game.triggerDeath('lava');
  });
  // finish() fires inside the 450ms death delay — include it in the window.
  // 8s of climbing crosses the first boss boundary, so a fresh-story profile
  // routes death through Cutscene first (same handling as levels.spec).
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    return g.scene.isActive('Cutscene') || g.scene.isActive('GameOver');
  }), { timeout: 10_000 }).toBe(true);
  const recWallSec = (Date.now() - tRecStart) / 1000; // clip window ends at death, measure before skipping cutscenes
  const onCutscene = await page.evaluate(() => (window as any).__game.scene.isActive('Cutscene'));
  if (onCutscene) {
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (window as any).__game.scene.keys.Cutscene.skipAll();
    });
    await waitForScene(page, 'GameOver');
  }
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const go = (window as any).__game.scene.keys.GameOver;
    return go.children.list.some((c: any) => c.text && String(c.text).includes('SHARE CLIP'));
  }), { timeout: 5000 }).toBe(true);
  await page.keyboard.press('KeyC');
  await expect(page.locator('#ll-clip')).toBeVisible();
  const durationSec = await clipVideoDuration(page);
  // Generous band: headless capture cadence wobbles, but a compacted-timeline
  // regression lands far outside it (v0.14 measured ~3.4x compression).
  expect(durationSec).toBeGreaterThan(recWallSec * 0.6);
  expect(durationSec).toBeLessThan(recWallSec * 1.4);
});
