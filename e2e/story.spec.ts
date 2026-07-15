import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('fresh profile: opening cutscene plays, skip lands on Menu, Journal has the oath page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Cutscene');
  await page.waitForTimeout(700); // clear the cutscene's 600ms boot-debounce guard
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Cutscene.skipAll();
  });
  // A fresh profile's first Menu boot auto-opens What's New (version change) —
  // close it before looking for the Menu.
  await waitForScene(page, 'Changelog');
  await page.keyboard.press('Escape');
  await waitForScene(page, 'Menu');
  await page.keyboard.press('KeyJ');
  await waitForScene(page, 'Journal');
  const unlocked = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lavaleap.save.v2')!).story.unlockedPages as string[]);
  expect(unlocked).toContain('oath');
  const watched = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('lavaleap.save.v2')!).story.watchedCutscenes as string[]);
  expect(watched).toContain('opening');
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});

test('veteran save: no vignette, Journal accessible, Cole locked in Shop', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.11.0',
      analytics: { runs: 5 },
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu'); // straight to Menu — no vignette for veterans
  await page.keyboard.press('KeyC');
  await waitForScene(page, 'Shop');
  const rowText = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const shop = (window as any).__game.scene.keys.Shop;
    return shop.rows.map((r: { text: string }) => r.text).join('\n');
  });
  expect(rowText).toContain('Cole');
  expect(rowText).toContain('[LOCKED]');
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
