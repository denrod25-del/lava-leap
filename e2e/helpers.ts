import { expect, type Page } from '@playwright/test';

/** Wait until a named Phaser scene is active (v8.2 lesson: asset growth lengthens
 *  boot past any fixed wait — poll the scene manager instead of sleeping). */
export async function waitForScene(page: Page, key: string, timeout = 10_000): Promise<void> {
  await expect.poll(async () => page.evaluate((k) => {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const g = (window as any).__game;
    return g ? g.scene.isActive(k) : false;
  }, key), { timeout }).toBe(true);
}
