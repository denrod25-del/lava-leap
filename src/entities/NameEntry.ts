import { validateName, generateHandle } from '../core/playerName';

/** Modal HTML overlay for entering/editing the leaderboard name. Resolves with the
 *  validated name, or null if cancelled. Uses a real <input> so mobile keyboards work. */
export function promptName(current: string): Promise<string | null> {
  return new Promise((resolve) => {
    const suggestion = current || generateHandle(Math.random);
    const wrap = document.createElement('div');
    wrap.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;flex-direction:column;'
      + 'align-items:center;justify-content:center;background:rgba(8,8,16,0.86);font-family:monospace;color:#fff;padding:20px';
    wrap.innerHTML = `
      <div style="font-size:20px;color:#ffb066;margin-bottom:14px">LEADERBOARD NAME</div>
      <input id="ll-name" maxlength="12"
        style="font-family:monospace;font-size:20px;text-align:center;padding:10px 14px;width:220px;
        border:2px solid #16e0e0;border-radius:8px;background:#10101a;color:#fff;text-transform:none" />
      <div id="ll-name-err" style="font-size:12px;color:#ff6b6b;height:16px;margin-top:8px"></div>
      <div style="margin-top:14px;display:flex;gap:12px">
        <button id="ll-name-ok" style="font-family:monospace;font-size:16px;padding:8px 18px;background:#16e0e0;color:#04202a;border:0;border-radius:6px;cursor:pointer">SAVE</button>
        <button id="ll-name-cancel" style="font-family:monospace;font-size:16px;padding:8px 18px;background:#333;color:#fff;border:0;border-radius:6px;cursor:pointer">CANCEL</button>
      </div>`;
    document.body.appendChild(wrap);
    const input = wrap.querySelector('#ll-name') as HTMLInputElement;
    const err = wrap.querySelector('#ll-name-err') as HTMLDivElement;
    // Set programmatically (not via attribute interpolation) so the suggestion can
    // never break out of the markup, however it was produced.
    input.value = suggestion;
    input.focus(); input.select();

    const close = (val: string | null): void => { wrap.remove(); resolve(val); };
    const submit = (): void => {
      const r = validateName(input.value);
      if (r.ok) close(r.name); else err.textContent = r.reason;
    };
    (wrap.querySelector('#ll-name-ok') as HTMLButtonElement).onclick = submit;
    (wrap.querySelector('#ll-name-cancel') as HTMLButtonElement).onclick = () => close(null);
    input.onkeydown = (e) => {
      if (e.key === 'Enter') { e.preventDefault(); submit(); }
      else if (e.key === 'Escape') { e.preventDefault(); close(null); }
    };
  });
}
