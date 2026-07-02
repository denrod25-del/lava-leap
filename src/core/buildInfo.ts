// Build identity. The __*__ globals are injected by vite.config.ts `define` at build
// time; under vitest (no define) they're undefined, so fall back to dev sentinels.
export const APP_NAME = 'Lava Leap';
export const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : '0.0.0-dev';
export const BUILD_ID = typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';
export const BUILD_DATE = typeof __BUILD_DATE__ !== 'undefined' ? __BUILD_DATE__ : 'dev';
export const VERSION_LABEL = `v${APP_VERSION}`;
export const BUILD_LABEL = `v${APP_VERSION} · ${BUILD_ID}`;
