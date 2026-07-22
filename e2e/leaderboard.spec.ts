import { test, expect } from '@playwright/test';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('disabled leaderboards: game boots, plays, and dies clean with no online UI', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({ version: 2, tutorialDone: true, lastSeenVersion: '0.16.0' }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500);

  // No env in dev → client disabled → no submit/rank calls, no leaderboard UI.
  const state = await page.evaluate(() => {
    const w = window as unknown as {
      __game?: { scene: { keys: Record<string, { scene: { key: string } }> } };
    };
    const g = w.__game;
    return {
      booted: !!g,
      leaderboardSceneRegistered: !!g?.scene.keys['Leaderboard'], // scene may exist; the MENU ENTRY must not
    };
  });
  expect(state.booted, 'game booted with __game handle').toBe(true);

  // 'L' must NOT open the Leaderboard when disabled (the hotkey is gated).
  await page.keyboard.press('L');
  await page.waitForTimeout(400);
  const activeAfterL = await page.evaluate(() => {
    const w = window as unknown as { __game?: { scene: { getScenes(active: boolean): Array<{ scene: { key: string } }> } } };
    return w.__game?.scene.getScenes(true).map((s) => s.scene.key) ?? [];
  });
  expect(activeAfterL, 'L key must be inert when leaderboards are disabled').not.toContain('Leaderboard');

  // Start a run and play briefly — identity minting + disabled submit path must not error.
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Space', { delay: 40 });
  await page.waitForTimeout(400);
  await page.keyboard.up('ArrowRight');

  // Identity exists in the save (minted at boot).
  const identity = await page.evaluate(() => {
    const raw = localStorage.getItem('lavaleap.save.v2');
    return raw ? (JSON.parse(raw) as { identity?: { playerId?: string } }).identity : undefined;
  });
  expect(identity?.playerId, 'playerId minted and persisted').toBeTruthy();

  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
