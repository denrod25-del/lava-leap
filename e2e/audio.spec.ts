import { test, expect } from '@playwright/test';

// Audio pipeline: every key decodes at boot, the WebAudio context unlocks on the
// first real gesture, menu/gameplay music actually play, and one-shots fire.
// Uses window.__game (DEV-only) — the e2e web server runs `npm run dev`.

test('audio decodes, unlocks on gesture, and plays in menu + run', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));

  // v0.9.0: fresh profiles boot to the story Vignette; seed a veteran save so
  // this test lands on the Menu (where menu music plays) as it always did.
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.16.0', analytics: { runs: 1 },
    }));
  });
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  await page.waitForTimeout(3000); // boot + audio decode (the slow part of the loader)

  // Real gesture unlocks WebAudio; Escape closes the auto-shown What's New → Menu.
  await page.mouse.click(240, 650);
  await page.waitForTimeout(400);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(900);

  const menu = await page.evaluate(() => {
    const g = (window as unknown as { __game: Phaser.Game }).__game;
    const expected = ['sfx-jump', 'sfx-coin', 'sfx-death', 'sfx-music-menu', 'sfx-rumble', 'sfx-scrape',
      'sfx-crack', 'sfx-swell', 'sfx-ding', 'sfx-kaching', 'sfx-ui-move', 'sfx-ui-select', 'sfx-stomp',
      'sfx-hit', 'sfx-pickup', 'sfx-expire', 'sfx-boss-roar', 'sfx-projectile', 'sfx-music-game'];
    return {
      missing: expected.filter((k) => !g.cache.audio.has(k)),
      ctx: (g.sound as Phaser.Sound.WebAudioSoundManager).context?.state,
      locked: g.sound.locked,
      playing: g.sound.getAllPlaying().map((s) => s.key),
    };
  });
  expect(menu.missing, 'audio keys missing from cache').toEqual([]);
  expect(menu.ctx).toBe('running');
  expect(menu.locked).toBe(false);
  expect(menu.playing).toContain('sfx-music-menu');

  // Start a run: gameplay music takes over (AudioDirector stopAll + play).
  await page.keyboard.press('Space');
  await page.waitForTimeout(1200);
  const run = await page.evaluate(() => {
    const g = (window as unknown as { __game: Phaser.Game }).__game;
    return { playing: g.sound.getAllPlaying().map((s) => s.key) };
  });
  expect(run.playing).toContain('sfx-music-game');
  expect(run.playing).not.toContain('sfx-music-menu'); // menu music must not leak into runs

  // One-shot SFX actually starts.
  const oneshot = await page.evaluate(() => new Promise<{ ok: boolean; isPlaying: boolean }>((res) => {
    const g = (window as unknown as { __game: Phaser.Game }).__game;
    const s = g.sound.add('sfx-coin');
    const ok = s.play();
    setTimeout(() => res({ ok, isPlaying: s.isPlaying }), 120);
  }));
  expect(oneshot.ok).toBe(true);
  expect(oneshot.isPlaying).toBe(true);

  expect(errors, 'console/page errors:\n' + errors.join('\n')).toHaveLength(0);
});
