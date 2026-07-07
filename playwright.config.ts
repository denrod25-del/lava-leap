import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  webServer: {
    // `--mode test` loads .env.test (blank Supabase creds) which overrides any
    // developer's local .env, so e2e always exercises the shipping default
    // (leaderboards dormant) deterministically. reuseExistingServer off so a
    // stray dev server on 5188 can't serve the wrong (enabled) build.
    command: 'npm run dev -- --mode test',
    url: 'http://localhost:5188',
    reuseExistingServer: false,
    timeout: 120000,
  },
  use: {
    baseURL: 'http://localhost:5188',
    // Headless Chromium needs a working software-GL stack or Phaser's WebGL
    // renderer fails with "Framebuffer Unsupported". These flags enable
    // SwiftShader so the real WebGL path runs in CI/headless.
    launchOptions: {
      args: [
        '--use-gl=angle',
        '--use-angle=swiftshader',
        '--enable-unsafe-swiftshader',
        '--ignore-gpu-blocklist',
      ],
    },
  },
});
