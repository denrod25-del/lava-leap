// e2e/clips.spec.ts
import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

const SEED = {
  version: 2, tutorialDone: true, lastSeenVersion: '0.16.0',
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
