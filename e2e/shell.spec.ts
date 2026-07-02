import { test, expect } from '@playwright/test';

// The public-facing HTML shell: readable content + build identity must be
// present in the raw HTML (view-source / crawlers / no-JS), and the static
// pre-loader must hand off to the game once Phaser boots.

test('raw HTML exposes readable public content and build info', async ({ request }) => {
  const res = await request.get('/');
  const html = await res.text();

  // Metadata
  expect(html).toContain('<title>Lava Leap — Arcade Lava Climber</title>');
  expect(html).toContain('Jump, climb, and escape rising lava in a fast arcade platformer.');
  expect(html).toContain('og:image');
  expect(html).toContain('application/ld+json');

  // Build identity stamped into the static shell (no %PLACEHOLDER% left behind).
  expect(html).toMatch(/v\d+\.\d+\.\d+/);
  expect(html).not.toContain('%APP_VERSION%');
  expect(html).not.toContain('%BUILD_ID%');
  expect(html).not.toContain('%BUILD_DATE%');

  // Pre-loader + no-JS content
  expect(html).toContain('Loading Lava Leap');
  expect(html).toContain('<noscript>');
  expect(html).toContain('Desktop controls');
  expect(html).toContain('Mobile controls');
});

test('pre-loader is removed once the game boots', async ({ page }) => {
  await page.goto('/');
  // Present in the initial DOM…
  // (attached, not visible — Phaser may boot before the assertion runs)
  await expect(page.locator('canvas')).toBeVisible();
  // …and gone shortly after Phaser is READY (fade + remove).
  await expect(page.locator('#preloader')).toHaveCount(0, { timeout: 5000 });
});
