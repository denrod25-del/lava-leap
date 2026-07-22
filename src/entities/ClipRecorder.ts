// src/entities/ClipRecorder.ts
import Phaser from 'phaser';
import { advance, initialState, pickWinner, type RotationState } from '../core/clipRotation';
import { track } from '../core/track';

export interface ClipResult { blob: Blob; mimeType: string }

const MIME_CANDIDATES = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm'];

interface Slot { rec: MediaRecorder | null; chunks: Blob[] }

/** Owns the rolling highlight recording for one run: canvas + game-audio stream,
 *  two leapfrogging MediaRecorders (see clipRotation), pause mirroring, and
 *  finish() -> the last 15-30s as one valid video file. Any recorder error
 *  silently tears the whole thing down - the game must never break over a clip. */
export class ClipRecorder {
  private state: RotationState = initialState();
  private slots: { a: Slot; b: Slot } = { a: { rec: null, chunks: [] }, b: { rec: null, chunks: [] } };
  private stream: MediaStream;
  private mimeType: string;
  private dead = false;
  private paused = false;

  static supported(): boolean {
    if (typeof MediaRecorder === 'undefined') return false;
    const canvas = document.createElement('canvas') as HTMLCanvasElement & { captureStream?: (fps?: number) => MediaStream };
    if (typeof canvas.captureStream !== 'function') return false;
    return MIME_CANDIDATES.some((m) => MediaRecorder.isTypeSupported(m));
  }

  private frameTrack: (MediaStreamTrack & { requestFrame?: () => void }) | null = null;
  private lastCapMs = 0;

  constructor(private scene: Phaser.Scene) {
    this.mimeType = MIME_CANDIDATES.find((m) => MediaRecorder.isTypeSupported(m))!;
    const canvas = this.scene.game.canvas as HTMLCanvasElement & { captureStream: (fps?: number) => MediaStream };
    // Frame capture is DRIVEN, not timer-sampled: captureStream(0) produces no
    // automatic frames; we requestFrame() on Phaser's POST_RENDER, the one moment
    // the WebGL buffer is guaranteed valid. The old captureStream(30) timer read
    // the buffer between paints (preserveDrawingBuffer was false) and captured
    // ~9fps with compacted timestamps — clips played fast-forwarded and jerky.
    this.stream = canvas.captureStream(0);
    const track = this.stream.getVideoTracks()[0] as MediaStreamTrack & { requestFrame?: () => void };
    if (typeof track.requestFrame === 'function') {
      this.frameTrack = track;
      this.scene.game.events.on(Phaser.Core.Events.POST_RENDER, this.onPostRender, this);
    } else {
      // No requestFrame (older WebKit): fall back to timer sampling — with
      // preserveDrawingBuffer now true in the game config, the timer at least
      // always finds a readable buffer.
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = canvas.captureStream(30);
    }
    // Tap the game's WebAudio master so the clip carries music/SFX at player volumes.
    // HTML5-audio fallback mode (no WebAudio) records video-only.
    const sm = this.scene.sound;
    if (sm instanceof Phaser.Sound.WebAudioSoundManager) {
      const dest = sm.context.createMediaStreamDestination();
      sm.masterVolumeNode.connect(dest);
      dest.stream.getAudioTracks().forEach((t) => this.stream.addTrack(t));
    }
    // Clips must not contain the pause screen.
    this.scene.events.on(Phaser.Scenes.Events.PAUSE, this.onPause, this);
    this.scene.events.on(Phaser.Scenes.Events.RESUME, this.onResume, this);
    this.scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.teardown());
  }

  /** POST_RENDER: push the just-rendered frame into the stream, capped at ~30fps
   *  so the encoder sees a steady cadence without doubling its load at 60fps. */
  private onPostRender(): void {
    if (this.dead || this.paused || !this.frameTrack) return;
    const now = performance.now();
    if (now - this.lastCapMs < 30) return;
    this.lastCapMs = now;
    this.frameTrack.requestFrame!();
  }

  /** Call each frame. Cheap no-op between 15s rotation boundaries.
   *  Rotation runs on performance.now(), NOT the scene clock: MediaRecorder
   *  records in wall time, and Phaser's clamped/smoothed deltas make the scene
   *  clock lag wall time under load — rotating on it would stretch clip windows
   *  far past 30s of real footage on slow devices. */
  update(_sceneNowMs?: number): void {
    if (this.dead || this.paused) return;
    const { state, actions } = advance(this.state, performance.now());
    this.state = state;
    for (const a of actions) {
      if (a === 'startA') this.startSlot('a');
      else if (a === 'stopA') this.discardSlot('a');
      else if (a === 'startB') this.startSlot('b');
      else this.discardSlot('b');
    }
  }

  /** Stop the winner and resolve its footage; discard the other. Null = nothing usable. */
  finish(_sceneNowMs?: number): Promise<ClipResult | null> {
    if (this.dead) return Promise.resolve(null);
    this.dead = true;
    const winner = pickWinner(this.state, performance.now());
    const loser = winner === 'a' ? 'b' : 'a';
    this.discardSlot(loser as 'a' | 'b');
    if (!winner) { this.teardown(); return Promise.resolve(null); }
    const slot = this.slots[winner];
    const rec = slot.rec;
    if (!rec || rec.state === 'inactive') { this.teardown(); return Promise.resolve(null); }
    return new Promise((resolve) => {
      // Belt & braces: never leave GameScene hanging on a stuck encoder.
      const bail = setTimeout(() => { this.teardown(); resolve(null); }, 3000);
      rec.onstop = () => {
        clearTimeout(bail);
        const blob = new Blob(slot.chunks, { type: this.mimeType });
        this.teardown();
        resolve(blob.size > 0 ? { blob, mimeType: this.mimeType } : null);
      };
      try { rec.stop(); } catch { clearTimeout(bail); this.teardown(); resolve(null); }
    });
  }

  private startSlot(k: 'a' | 'b'): void {
    const slot = this.slots[k];
    slot.chunks = [];
    try {
      const rec = new MediaRecorder(this.stream, { mimeType: this.mimeType, videoBitsPerSecond: 2_500_000 });
      rec.ondataavailable = (e) => { if (e.data.size > 0) slot.chunks.push(e.data); };
      rec.onerror = () => { track('clip_error', {}); this.dead = true; this.teardown(); };
      rec.start();
      slot.rec = rec;
    } catch {
      track('clip_error', {});
      this.dead = true;
      this.teardown();
    }
  }

  private discardSlot(k: 'a' | 'b'): void {
    const slot = this.slots[k];
    if (slot.rec && slot.rec.state !== 'inactive') { try { slot.rec.stop(); } catch { /* already gone */ } }
    slot.rec = null;
    slot.chunks = [];
  }

  private onPause(): void {
    this.paused = true;
    for (const k of ['a', 'b'] as const) {
      const r = this.slots[k].rec;
      if (r && r.state === 'recording') { try { r.pause(); } catch { /* not supported -> pause screen leaks in, acceptable */ } }
    }
  }

  private onResume(): void {
    this.paused = false;
    for (const k of ['a', 'b'] as const) {
      const r = this.slots[k].rec;
      if (r && r.state === 'paused') { try { r.resume(); } catch { /* see onPause */ } }
    }
  }

  private teardown(): void {
    this.scene.game.events.off(Phaser.Core.Events.POST_RENDER, this.onPostRender, this);
    this.frameTrack = null;
    this.scene.events.off(Phaser.Scenes.Events.PAUSE, this.onPause, this);
    this.scene.events.off(Phaser.Scenes.Events.RESUME, this.onResume, this);
    for (const k of ['a', 'b'] as const) {
      const r = this.slots[k].rec;
      if (r && r.state !== 'inactive') { try { r.stop(); } catch { /* already gone */ } }
      this.slots[k].rec = null;
    }
    this.stream.getTracks().forEach((t) => t.stop());
  }
}
