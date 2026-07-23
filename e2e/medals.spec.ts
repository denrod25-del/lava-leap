// e2e/medals.spec.ts
import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

const SEED = { version: 2, tutorialDone: true, lastSeenVersion: '0.19.1', analytics: { runs: 5 } };

test('a fast forced clear earns GOLD: shown on LEVEL CLEAR, stored with best time', async ({ page }) => {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify(seed));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', { levelId: 'level-1' });
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(500);
  // Make the clear read ~5s, then force the boss survive (levels.spec poke pattern).
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    g.runStartMs = g.time.now - 5000;
    g.gameEvents.emit('bossPhase', { zoneIndex: 1, phase: 'start' });
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Game.gameEvents.emit('bossPhase', { zoneIndex: 1, phase: 'end' });
  });
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    return g.scene.isActive('Cutscene') || g.scene.isActive('GameOver');
  }), { timeout: 10_000 }).toBe(true);
  const onCutscene = await page.evaluate(() => (window as any).__game.scene.isActive('Cutscene'));
  if (onCutscene) {
    await page.waitForTimeout(700);
    await page.evaluate(() => (window as any).__game.scene.keys.Cutscene.skipAll());
    await waitForScene(page, 'GameOver');
  }
  const shown = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const go = (window as any).__game.scene.keys.GameOver;
    return go.children.list.some((c: any) => c.text && String(c.text).includes('GOLD'));
  });
  expect(shown).toBe(true);
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('lavaleap.save.v2')!).levels);
  expect(stored.medals['level-1']).toBe('gold');
  expect(stored.bestTimes['level-1']).toBeGreaterThan(3000);
  expect(stored.bestTimes['level-1']).toBeLessThan(20000);
});
