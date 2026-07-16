import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

test('dash → jump-cancel chains raise Flow and expose HUD state', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  // Fresh profile boots to the vignette; skip it, close the auto-shown What's New,
  // then poll for the Menu before Space (fixed waits break as assets grow).
  await waitForScene(page, 'Cutscene');
  await page.waitForTimeout(700); // clear the cutscene's 600ms boot-debounce guard
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.keys.Cutscene.skipAll();
  });
  await waitForScene(page, 'Changelog');
  await page.keyboard.press('Escape'); // dismiss auto-shown What's New (fresh profile)
  await waitForScene(page, 'Menu');
  await page.keyboard.press('Space');  // start run
  await waitForScene(page, 'Game');
  await page.waitForTimeout(800);

  // Repeated jump → air-dash → jump-cancel chains (Space, Shift, Space).
  // A short `delay` on each press is required: Playwright's zero-delay press()
  // fires keydown+keyup in the same tick, which Phaser's variable-height
  // jump-cut (cut upward velocity on release) can consume before the physics
  // step ever registers airtime — the jump never leaves the ground and dash's
  // `!onGround` guard silently no-ops every beat (flow stays 0). A 40ms delay
  // gives the engine a frame of "key held" so the jump/dash actually fire.
  for (let i = 0; i < 6; i++) {
    await page.keyboard.press('Space', { delay: 40 });
    await page.waitForTimeout(120);
    await page.keyboard.press('Shift', { delay: 40 });
    await page.waitForTimeout(60);
    await page.keyboard.press('Space', { delay: 40 });
    await page.waitForTimeout(320);
  }

  // Read Flow state via the shared game registry (window.__game is the app's
  // established verification handle; scene.registry === game.registry).
  const flow = await page.evaluate(() => {
    const g = (window as unknown as { __game?: { registry: { get(k: string): unknown } } }).__game;
    return g?.registry.get('flow') as
      { value: number; tier: number; name: string; multiplier: number } | undefined;
  });
  expect(flow, 'flow registry entry missing — GameScene wiring broken').toBeTruthy();
  expect(flow!.value).toBeGreaterThan(0);
  expect(flow!.multiplier).toBeGreaterThanOrEqual(1);
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});

test('dash-jump cancel keeps momentum; i-frames only while dashing', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.12.0',
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu'); // poll: boot time grows with each character's assets
  await page.keyboard.press('Space'); // start run
  await waitForScene(page, 'Game');
  await page.waitForTimeout(800);

  // Deterministic frame-level probe: force an active dash, dispatch a real Space
  // keydown, step the loop once, and read the result atomically (all inside one
  // synchronous evaluate, so the live RAF loop can't interleave).
  const r = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    const s = g.scene.keys.Game;
    const body = s.player.sprite.body;
    body.reset(300, s.player.sprite.y - 300); // safely airborne
    const invulnBefore = s.player.invulnerable; // not dashing yet → false
    s.player.dashTimer = 160; s.player.dashDir = 1; s.player.jumpsUsed = 0;
    const invulnDuringDash = s.player.invulnerable;
    window.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 32, code: 'Space', key: ' ', bubbles: true }));
    g.loop.step(performance.now());
    const out = {
      invulnBefore, invulnDuringDash,
      dashingAfter: s.player.dashing,
      invulnAfter: s.player.invulnerable,
      vx: body.velocity.x, vy: body.velocity.y,
    };
    window.dispatchEvent(new KeyboardEvent('keyup', { keyCode: 32, code: 'Space', key: ' ', bubbles: true }));
    return out;
  });
  expect(r.invulnBefore, 'invulnerable must be false when not dashing').toBe(false);
  expect(r.invulnDuringDash, 'invulnerable must be true during a dash').toBe(true);
  expect(r.dashingAfter, 'jump mid-dash must end the dash').toBe(false);
  expect(r.invulnAfter, 'i-frames must end with the dash').toBe(false);
  expect(r.vx, 'cancel must keep the dash horizontal speed (520)').toBeGreaterThan(400);
  expect(r.vy, 'cancel must apply the full jump kick (-650)').toBeLessThan(-500);
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});

test('reduced motion: flow visuals stay quiet and the game runs clean', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    // Seed a save with reducedMotion on. Partial blob is fine — SaveData.load()
    // deep-merges defaults. lastSeenVersion must match package.json to suppress
    // the What's New auto-popup.
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2,
      settings: { musicVol: 7, sfxVol: 7, screenShake: true, reducedMotion: true },
      tutorialDone: true,
      lastSeenVersion: '0.12.0',
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu'); // poll: boot time grows with each character's assets
  await page.keyboard.press('Space'); // start run (no popups: seeded save)
  await waitForScene(page, 'Game');
  await page.waitForTimeout(800);
  for (let i = 0; i < 4; i++) {
    await page.keyboard.press('Space', { delay: 40 });
    await page.waitForTimeout(120);
    await page.keyboard.press('Shift', { delay: 40 });
    await page.waitForTimeout(400);
  }
  await expect(page.locator('canvas')).toBeVisible();
  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
