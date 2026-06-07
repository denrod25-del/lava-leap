import { test, expect } from '@playwright/test';

test('boots to menu and starts a run without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();

  // Let the game boot to the menu (Phaser loop + boot->menu transition).
  await page.waitForTimeout(1500);

  // Start the run (real keyboard event -> Phaser receives SPACE).
  await page.keyboard.press('Space');
  await page.waitForTimeout(800);

  // Drive some input — should not throw.
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForTimeout(600);
  await page.keyboard.up('ArrowRight');

  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
