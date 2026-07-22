// e2e/anims.spec.ts
import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

const SEED = { version: 2, tutorialDone: true, lastSeenVersion: '0.16.0', analytics: { runs: 5 } };

async function startRun(page: import('@playwright/test').Page): Promise<void> {
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
  await page.waitForTimeout(400);
}

test('death plays the burn-up animation (death frame visible during the death window)', async ({ page }) => {
  await startRun(page);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Game.triggerDeath('lava');
  });
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    return g.player.sprite.texture.key as string;
  }), { timeout: 800 }).toMatch(/-death-\d$/);
});

test('crawler cycles its walk frames', async ({ page }) => {
  await startRun(page);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    g.enemies.spawn({ id: 424242, x: 150, y: 500, width: 160, type: 'static', hasCoin: false, enemy: { kind: 'crawler' } });
  });
  const first = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    return g.enemies.views.get(424242).sprite.texture.key as string;
  });
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    return g.enemies.views.get(424242).sprite.texture.key as string;
  }), { timeout: 2000 }).not.toBe(first);
});

test('titan shows the roar pose on boss start, then reverts', async ({ page }) => {
  await startRun(page);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    g.boss.start(0, g.runSeed, g.lava.surfaceY);
  });
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    return g.boss.titan?.texture?.key ?? '';
  }), { timeout: 1000 }).toBe('boss-titan-roar');
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    return g.boss.titan?.texture?.key ?? '';
  }), { timeout: 2000 }).toBe('boss-titan');
});
