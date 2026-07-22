import { test, expect } from '@playwright/test';
import { waitForScene } from './helpers';

test('Kiko: shop purchase, triple jump on keyboard, ledge grab→vault refunds jumps', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.16.0',
      analytics: { runs: 5 }, coinBank: 1000,
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await waitForScene(page, 'Menu');

  // Buy + equip through the Shop's real purchase path (keyboard-driven; the
  // Characters tab is the Shop's opening tab and kiko is the 4th roster row).
  await page.keyboard.press('KeyC');
  await waitForScene(page, 'Shop');
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await page.keyboard.press('ArrowDown', { delay: 40 });
  await page.keyboard.press('Enter', { delay: 40 });
  const save = await page.evaluate(() => JSON.parse(localStorage.getItem('lavaleap.save.v2')!));
  expect(save.ownedCharacters).toContain('kiko');
  expect(save.character).toBe('kiko');
  expect(save.coinBank).toBe(250); // 1000 - 750

  // Start a run as Kiko; keyboard maxJumps must be 3 (standard characters get 2).
  await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    (window as any).__game.scene.start('Game', {});
  });
  await waitForScene(page, 'Game');
  await page.waitForTimeout(400);
  const maxJumps = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    return (window as any).__game.scene.keys.Game.player.maxJumps;
  });
  expect(maxJumps).toBe(3);

  // Forced ledge scenario via direct update pokes (deterministic, no physics race).
  const ledge = await page.evaluate(() => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game.scene.keys.Game;
    const player = g.player;
    const plat = g.stream.active.find((p: any) => p.type === 'static');
    const body = player.sprite.body;
    body.reset(plat.x - 15, plat.y + 8);
    body.velocity.y = 120;
    player.jumpsUsed = 3;
    const input = { runAxis: 1, jumpHeld: false, jumpPressed: false, dashPressed: false, fastFall: false };
    player.update(input, g.stream.active);
    const hanging = player.hanging;
    player.update({ ...input, jumpPressed: true }, g.stream.active);
    return { hanging, jumpsAfter: player.jumpsUsed, vyAfter: body.velocity.y };
  });
  expect(ledge.hanging).toBe(true);
  expect(ledge.jumpsAfter).toBe(0);
  expect(ledge.vyAfter).toBeLessThan(0);

  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
