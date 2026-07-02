import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('./package.json', 'utf8')) as { version: string };

const commit = (() => {
  try { return execSync('git rev-parse --short HEAD').toString().trim(); } catch { return 'dev'; }
})();

const buildDate = new Date().toISOString().slice(0, 10);

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
    __BUILD_ID__: JSON.stringify(commit),
    __BUILD_DATE__: JSON.stringify(buildDate),
  },
  plugins: [
    {
      // Stamp build identity into the static HTML shell (pre-loader, noscript,
      // JSON-LD) so version/commit are visible in view-source before any JS runs.
      name: 'html-build-info',
      transformIndexHtml(html: string) {
        return html
          .replaceAll('%APP_VERSION%', pkg.version)
          .replaceAll('%BUILD_ID%', commit)
          .replaceAll('%BUILD_DATE%', buildDate);
      },
    },
  ],
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
});
