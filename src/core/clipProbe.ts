// src/core/clipProbe.ts
/** Decode a recorded blob's real media duration off-screen. MediaRecorder blobs
 *  often report Infinity until seeked past the end — the standard workaround.
 *  Resolves null on any failure or after timeoutMs; never throws. */
export function measureBlobDurationMs(blob: Blob, timeoutMs = 5000): Promise<number | null> {
  return new Promise((resolve) => {
    let settled = false;
    const url = URL.createObjectURL(blob);
    const v = document.createElement('video');
    const done = (ms: number | null): void => {
      if (settled) return;
      settled = true;
      clearTimeout(bail);
      URL.revokeObjectURL(url);
      v.removeAttribute('src');
      resolve(ms);
    };
    const bail = setTimeout(() => done(null), timeoutMs);
    v.preload = 'metadata';
    v.muted = true;
    v.onloadedmetadata = () => {
      if (Number.isFinite(v.duration) && v.duration > 0) { done(Math.round(v.duration * 1000)); return; }
      v.onseeked = () => done(Number.isFinite(v.duration) && v.duration > 0 ? Math.round(v.duration * 1000) : null);
      try { v.currentTime = 1e7; } catch { done(null); }
    };
    v.onerror = () => done(null);
    v.src = url;
  });
}
