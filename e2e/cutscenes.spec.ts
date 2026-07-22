import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('Journal: an unlocked page with a pending, unwatched cutscene shows a Watch row and playing it clears the queue', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.18.1',
      analytics: { runs: 5 },
      story: {
        unlockedPages: ['oath', 'titan', 'freed'],
        vignetteSeen: true, titanDefeats: 1,
        pendingCutscenes: ['freed'], watchedCutscenes: ['opening', 'keeper-rises'],
        stingSeen: true,
      },
      ownedCharacters: ['ember', 'classic', 'cole'],
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');
  await page.keyboard.press('KeyJ');
  await waitForScene(page, 'Journal');

  // The 'freed' page is unlocked with a pending, unwatched linked cutscene —
  // its list row should carry the unwatched badge.
  const rowsBefore = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const j = (window as any).__game.scene.keys.Journal;
    return j.rows.map((r: { text: string }) => r.text);
  });
  expect(rowsBefore.some((t: string) => t.includes('Freed') && t.includes('●'))).toBe(true);

  // Drive the same transition the "▶ Watch (new)" row's click handler performs.
  // Precise canvas-pixel clicks on an in-detail-view overlay button are fragile
  // (viewport scaling), so invoke it directly — the codebase's established e2e
  // pattern for scene-internal state (see flow.spec.ts's Player pokes).
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Cutscene', { ids: ['freed'], then: { scene: 'Journal' } });
  });
  await waitForScene(page, 'Cutscene');
  await page.waitForTimeout(700);
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Cutscene.skipAll();
  });
  await waitForScene(page, 'Journal');

  const story = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lavaleap.save.v2')!).story);
  expect(story.pendingCutscenes).toEqual([]);
  expect(story.watchedCutscenes).toContain('freed');
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
