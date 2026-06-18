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

  test('tapping the screen steers without errors', async ({ page }) => {
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

    // In autopilot the whole screen is a steer surface: a tap sets a momentary
    // steer target at that x. Tap left and right of centre to exercise both ways.
    const box = await canvas.boundingBox();
    if (!box) throw new Error('canvas has no bounding box');
    const yTouch = box.y + box.height * 0.78;            // lower-middle, clear of the buttons
    const leftX = box.x + box.width * (1 / 6);           // left of centre
    const rightX = box.x + box.width * (5 / 6);          // right of centre

    // Tap left, then right, a few times. Goal: the touch steer path runs
    // (pointer events -> TouchSteerInput) without throwing.
    for (let i = 0; i < 3; i++) {
      await page.touchscreen.tap(rightX, yTouch);
      await page.waitForTimeout(250);
      await page.touchscreen.tap(leftX, yTouch);
      await page.waitForTimeout(250);
    }

    await expect(canvas).toBeVisible();
    expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
  });

  test('autopilot: drag to steer + dash runs without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    page.on('pageerror', (e) => errors.push(String(e)));

    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await page.waitForTimeout(1500);
    await page.keyboard.press('Space'); // start run
    await page.waitForTimeout(800);

    const box = (await page.locator('canvas').boundingBox())!;
    // Drag across the lower-middle of the canvas to steer.
    await page.touchscreen.tap(box.x + box.width * 0.3, box.y + box.height * 0.7);
    await page.waitForTimeout(150);
    await page.touchscreen.tap(box.x + box.width * 0.7, box.y + box.height * 0.7);
    await page.waitForTimeout(150);
    // Tap the DASH button (bottom-right).
    await page.touchscreen.tap(box.x + box.width * 0.86, box.y + box.height * 0.86);
    await page.waitForTimeout(500);

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
