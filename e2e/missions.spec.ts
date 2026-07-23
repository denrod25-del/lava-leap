// e2e/missions.spec.ts
import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

const SEED = { version: 2, tutorialDone: true, lastSeenVersion: '0.19.0', analytics: { runs: 5 } };

test('Missions scene lists exactly 3 missions with payouts', async ({ page }) => {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify(seed));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  await page.keyboard.press('KeyM');
  await waitForScene(page, 'Missions');
  const rows = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const s = (window as any).__game.scene.keys.Missions;
    return s.children.list.filter((c: any) => c.text && /\+\d+c$/.test(String(c.text))).map((c: any) => String(c.text));
  });
  expect(rows).toHaveLength(3);
});

test('a synthetic gameplay burst completes at least one mission: bank grows, scene shows a check', async ({ page }) => {
  await page.addInitScript((seed) => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify(seed));
  }, SEED);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  const bankBefore = await page.evaluate(() => JSON.parse(localStorage.getItem('lavaleap.save.v2')!).coinBank ?? 0);

  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(400);

  // Exceed every cumulative target in the pool; today's easy mission is always
  // cumulative (locked by a unit test), so >=1 completes regardless of rotation.
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    for (let i = 0; i < 60; i++) g.gameEvents.emit('coinCollected', {});
    for (let i = 0; i < 40; i++) g.gameEvents.emit('dash', {});
    for (let i = 0; i < 200; i++) g.gameEvents.emit('jump', {});
    for (let i = 0; i < 12; i++) g.gameEvents.emit('enemyStomped', {});
    for (let i = 0; i < 5; i++) g.gameEvents.emit('powerupCollected', { kind: 'shield' });
  });

  await expect.poll(async () => page.evaluate(() =>
    (JSON.parse(localStorage.getItem('lavaleap.save.v2')!).missions?.completed ?? []).length
  ), { timeout: 3000 }).toBeGreaterThan(0);

  const bankAfter = await page.evaluate(() => JSON.parse(localStorage.getItem('lavaleap.save.v2')!).coinBank ?? 0);
  expect(bankAfter).toBeGreaterThan(bankBefore);

  // End the run cleanly, then confirm the scene shows the check.
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Game.triggerDeath('lava');
  });
  await waitForScene(page, 'GameOver');
  await page.keyboard.press('Space');
  await waitForScene(page, 'Game');
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Missions');
  });
  await waitForScene(page, 'Missions');
  const hasCheck = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const s = (window as any).__game.scene.keys.Missions;
    return s.children.list.some((c: any) => c.text && String(c.text).startsWith('✓'));
  });
  expect(hasCheck).toBe(true);
});
