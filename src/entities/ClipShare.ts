// src/entities/ClipShare.ts
import { track } from '../core/track';

const GAME_URL = 'https://lava-leap-84pb.vercel.app';

/** Modal DOM overlay: clip replay + share sheet (phones) / download + caption (desktop).
 *  DOM (not Phaser) because <video> playback and navigator.share need real elements
 *  and a user-gesture context - same reasoning as the NameEntry overlay. */
export function openClipShare(opts: { blob: Blob; mimeType: string; score: number }): void {
  const ext = opts.mimeType.includes('mp4') ? 'mp4' : 'webm';
  const fileName = `lava-leap-${opts.score}.${ext}`;
  const file = new File([opts.blob], fileName, { type: opts.mimeType });
  const caption = `I scored ${opts.score.toLocaleString()} in Lava Leap 🌋 Can you beat it? → ${GAME_URL}`;
  const url = URL.createObjectURL(opts.blob);

  const wrap = document.createElement('div');
  wrap.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;'
    + 'align-items:center;justify-content:center;background:rgba(8,8,16,0.9);font-family:monospace;color:#fff;padding:20px';
  wrap.innerHTML = `
    <div style="font-size:20px;color:#ffb066;margin-bottom:12px">YOUR CLIMB</div>
    <video id="ll-clip" autoplay muted loop playsinline
      style="max-width:min(320px,80vw);max-height:50vh;border:2px solid #16e0e0;border-radius:8px;background:#000"></video>
    <div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;justify-content:center">
      <button id="ll-clip-share" style="font-family:monospace;font-size:15px;padding:10px 16px;background:#3ddc97;color:#04202a;border:0;border-radius:6px;cursor:pointer">SHARE</button>
      <button id="ll-clip-dl" style="font-family:monospace;font-size:15px;padding:10px 16px;background:#16e0e0;color:#04202a;border:0;border-radius:6px;cursor:pointer">DOWNLOAD</button>
      <button id="ll-clip-cap" style="font-family:monospace;font-size:15px;padding:10px 16px;background:#ffb066;color:#2a1512;border:0;border-radius:6px;cursor:pointer">COPY CAPTION</button>
      <button id="ll-clip-close" style="font-family:monospace;font-size:15px;padding:10px 16px;background:#333;color:#fff;border:0;border-radius:6px;cursor:pointer">CLOSE</button>
    </div>
    <div id="ll-clip-note" style="font-size:12px;color:#8a93a3;height:16px;margin-top:10px"></div>`;
  document.body.appendChild(wrap);

  (wrap.querySelector('#ll-clip') as HTMLVideoElement).src = url;
  const note = wrap.querySelector('#ll-clip-note') as HTMLDivElement;
  const shareBtn = wrap.querySelector('#ll-clip-share') as HTMLButtonElement;

  // Native share sheet only where the browser can hand a FILE to it (phones).
  const canSheet = typeof navigator.share === 'function'
    && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] });
  if (!canSheet) shareBtn.style.display = 'none';

  const close = (): void => { URL.revokeObjectURL(url); wrap.remove(); document.removeEventListener('keydown', onKey); };
  const onKey = (e: KeyboardEvent): void => { if (e.key === 'Escape') { e.preventDefault(); close(); } };
  document.addEventListener('keydown', onKey);

  shareBtn.onclick = () => {
    track('clip_share', { method: 'sheet' });
    navigator.share({ files: [file], text: caption, title: 'Lava Leap' }).catch(() => { /* user cancelled */ });
  };
  (wrap.querySelector('#ll-clip-dl') as HTMLButtonElement).onclick = () => {
    track('clip_share', { method: 'download' });
    const a = document.createElement('a');
    a.href = url; a.download = fileName; a.click();
    note.textContent = `saved as ${fileName}`;
  };
  (wrap.querySelector('#ll-clip-cap') as HTMLButtonElement).onclick = () => {
    track('clip_share', { method: 'caption' });
    void navigator.clipboard?.writeText(caption).then(() => { note.textContent = 'caption copied — paste it with your video'; });
  };
  (wrap.querySelector('#ll-clip-close') as HTMLButtonElement).onclick = close;
}
