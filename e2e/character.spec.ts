import { test, expect } from '@playwright/test';

function collectErrors(page: import('@playwright/test').Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  page.on('pageerror', (e) => errors.push(String(e)));
  return errors;
}

function readTextureKey(): string {
  const g = (window as unknown as { __game?: { scene: { keys: Record<string, { player?: { sprite: { texture: { key: string } } } }> } } }).__game;
  return g?.scene.keys['Game']?.player?.sprite.texture.key ?? '';
}

function isMenuActive(): boolean {
  const g = (window as unknown as { __game?: { scene: { isActive: (k: string) => boolean } } }).__game;
  return g?.scene.isActive('Menu') ?? false;
}

async function textureKeyAfterStart(page: import('@playwright/test').Page): Promise<string> {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible();
  // Boot preloads two full character asset sets before Menu's create() runs and
  // registers its keydown-SPACE handler (kb.once). A fixed sleep before pressing
  // Space raced that registration under load (Menu not yet active -> Space is
  // dropped -> Game scene never starts). Poll for Menu itself first, then press,
  // then poll for the run to actually start — deterministic instead of two guesses.
  await expect.poll(() => page.evaluate(isMenuActive), { timeout: 10000 }).toBe(true);
  await page.keyboard.press('Space'); // start run
  await expect.poll(() => page.evaluate(readTextureKey), { timeout: 5000 }).not.toBe('');
  return page.evaluate(readTextureKey);
}

test('default character run uses ember frames', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({ version: 2, tutorialDone: true, lastSeenVersion: '0.19.0' }));
  });
  const key = await textureKeyAfterStart(page);
  expect(key.startsWith('ember-'), `expected ember-* texture, got '${key}'`).toBe(true);
  expect(errors, errors.join('\n')).toHaveLength(0);
});

test('equipped classic character run uses classic frames', async ({ page }) => {
  const errors = collectErrors(page);
  await page.addInitScript(() => {
    localStorage.setItem('lavaleap.save.v2', JSON.stringify({
      version: 2, tutorialDone: true, lastSeenVersion: '0.19.0',
      character: 'classic', ownedCharacters: ['ember', 'classic'],
    }));
  });
  const key = await textureKeyAfterStart(page);
  expect(key.startsWith('classic-'), `expected classic-* texture, got '${key}'`).toBe(true);
  expect(errors, errors.join('\n')).toHaveLength(0);
});
