import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('fresh profile: vignette shows, skip lands on Menu, Journal has the oath page', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Vignette');
  // The vignette debounces input (600ms boot guard + 400ms between advances) so
  // key-repeat/double-taps can't skip beats — space the clicks accordingly.
  await page.waitForTimeout(700);
  await page.locator('canvas').click({ position: { x: 300, y: 360 } }); // beat 2
  await page.waitForTimeout(500);
  await page.locator('canvas').click({ position: { x: 300, y: 360 } }); // beat 3
  await page.waitForTimeout(500);
  await page.locator('canvas').click({ position: { x: 300, y: 360 } }); // finish
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
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});

test('veteran save: no vignette, Journal accessible, Cole locked in Shop', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.9.0',
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
