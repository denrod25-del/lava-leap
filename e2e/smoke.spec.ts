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

test('survives a gameplay stretch', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500);

  await page.keyboard.press('Space');   // start run
  await page.waitForTimeout(600);

  // Drive right + repeated jumps for ~2s: hold ArrowRight, press Space several times.
  await page.keyboard.down('ArrowRight');
  for (let i = 0; i < 5; i++) {
    await page.keyboard.press('Space');
    await page.waitForTimeout(400);
  }
  await page.keyboard.up('ArrowRight');

  await expect(page.locator('canvas')).toBeVisible();
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});

test.describe('touch', () => {
  test.use({ hasTouch: true, isMobile: true });

  test('touch input drives the player', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto('/');
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();
    await page.waitForTimeout(1500);

    // Start the run (the start screen accepts a tap anywhere as well as Space).
    await page.keyboard.press('Space');
    await page.waitForTimeout(800);

    // Compute screen coords inside the move zones from the canvas bounding box.
    // Left third = x in [0, w/3], right third = x in [2w/3, w]; y in 55%..100%.
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas has no bounding box');
    const yTouch = box.y + box.height * 0.78;            // ~78% down (within 55%-100%)
    const leftX = box.x + box.width * (1 / 6);           // center of left third
    const rightX = box.x + box.width * (5 / 6);          // center of right third

    // Tap left zone, then right zone, a few times. Goal: the touch path runs
    // (pointer events -> TouchInput zones) without throwing.
    for (let i = 0; i < 3; i++) {
      await page.touchscreen.tap(rightX, yTouch);
      await page.waitForTimeout(250);
      await page.touchscreen.tap(leftX, yTouch);
      await page.waitForTimeout(250);
    }

    await expect(canvas).toBeVisible();
    expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
  });
});

test('pause and resume mid-run without errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(1500);
  await page.keyboard.press('Space');   // start run
  await page.waitForTimeout(800);
  await page.keyboard.press('Escape');  // pause
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');  // resume
  await page.waitForTimeout(400);
  await page.keyboard.down('ArrowRight');
  await page.keyboard.press('Space');
  await page.waitForTimeout(500);
  await page.keyboard.up('ArrowRight');

  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
