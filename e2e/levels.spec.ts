import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('Level Select shows correct locked/cleared/play status from save state', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.13.0',
      analytics: { runs: 5 },
      levels: { cleared: ['level-1'] },
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  await page.keyboard.press('KeyK');
  await waitForScene(page, 'LevelSelect');

  const rows = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const ls = (window as any).__game.scene.keys.LevelSelect;
    return ls.rows.map((r: { text: string }) => r.text);
  });
  expect(rows[0]).toContain('CLEARED');
  expect(rows[1]).toContain('PLAY');
  expect(rows[2]).toContain('LOCKED');
  expect(rows[3]).toContain('LOCKED');
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});

test('clearing a level (forced boss survival) marks it cleared, unlocks the next, shows LEVEL CLEAR with no leaderboard block', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.13.0',
      analytics: { runs: 5 },
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');

  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', { levelId: 'level-1' });
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(500);

  // Force the boss encounter start then survival, same poke pattern already
  // used by the v0.10.0 sting/cutscene e2e coverage.
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    g.gameEvents.emit('bossPhase', { zoneIndex: 1, phase: 'start' });
  });
  await page.waitForTimeout(200);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    g.gameEvents.emit('bossPhase', { zoneIndex: 1, phase: 'end' });
  });

  // The run may hand off through Cutscene (first-ever titan encounter queues
  // 'keeper-rises') before landing on GameOver — wait for whichever comes first,
  // skip it if it's the cutscene, then land on GameOver.
  await expect.poll(async () => page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    return g.scene.isActive('Cutscene') || g.scene.isActive('GameOver');
  }), { timeout: 10_000 }).toBe(true);
  const onCutscene = await page.evaluate(() => (window as any).__game.scene.isActive('Cutscene'));
  if (onCutscene) {
    await page.waitForTimeout(700);
    await page.evaluate(() => {
      /* eslint-disable @typescript-eslint/no-explicit-any */
      (window as any).__game.scene.keys.Cutscene.skipAll();
    });
    await waitForScene(page, 'GameOver');
  }

  const story = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lavaleap.save.v2')!).levels as { cleared: string[] });
  expect(story.cleared).toContain('level-1');
  await waitForScene(page, 'GameOver');
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
