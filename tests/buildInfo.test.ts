import { describe, it, expect } from 'vitest';
import { APP_NAME, APP_VERSION, BUILD_ID, BUILD_DATE, VERSION_LABEL, BUILD_LABEL } from '../src/core/buildInfo';

describe('buildInfo', () => {
  it('exposes non-empty string fields (fallbacks under vitest)', () => {
    for (const v of [APP_NAME, APP_VERSION, BUILD_ID, BUILD_DATE]) {
      expect(typeof v).toBe('string');
      expect(v.length).toBeGreaterThan(0);
    }
    expect(APP_NAME).toBe('Lava Leap');
  });
  it('labels are derived from version + build id', () => {
    expect(VERSION_LABEL).toBe(`v${APP_VERSION}`);
    expect(BUILD_LABEL).toBe(`v${APP_VERSION} · ${BUILD_ID}`);
  });
});
