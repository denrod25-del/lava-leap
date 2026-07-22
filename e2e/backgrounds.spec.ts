// e2e/backgrounds.spec.ts
import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

const SEED = { version: 2, tutorialDone: true, lastSeenVersion: '0.18.0', analytics: { runs: 5 } };

async function boot(page: import('@playwright/test').Page): Promise<void> {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify(seed));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
}

test('menu shows the painted backdrop', async ({ page }) => {
  await boot(page);
  const hasArt = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const m = (window as any).__game.scene.keys.Menu;
    return m.children.list.some((c: any) => c.texture?.key === 'bg-menu');
  });
  expect(hasArt).toBe(true);
});

test('run starts on bg-z0 and crossfades after 2000px climbed', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(400);
  const startKey = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (window as any).__game.scene.keys.Game.bgFar.texture.key as string;
  });
  expect(startKey).toBe('bg-z0');
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    const T = g.player.sprite.body;
    // Teleport high enough that heightClimbed exceeds BG_SCENE_SPAN (2000):
    // TUNING.groundY is 640, height = groundY - y, so y = 640 - 2100 = -1460.
    T.reset(300, -1460);
  });
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    return { key: g.bgSceneKey as number, tex: g.bgFar.texture.key as string };
  }), { timeout: 3000 }).toEqual({ key: 1, tex: 'bg-z1' });
});

test('death screen shows the gameover art', async ({ page }) => {
  await boot(page);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(400);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Game.triggerDeath('lava');
  });
  await waitForScene(page, 'GameOver');
  const hasArt = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const go = (window as any).__game.scene.keys.GameOver;
    return go.children.list.some((c: any) => c.texture?.key === 'bg-gameover');
  });
  expect(hasArt).toBe(true);
});
