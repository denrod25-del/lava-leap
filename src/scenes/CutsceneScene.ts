import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save } from '../main';
import { CUTSCENES, type Shot, type ActorKey } from '../core/cutscenes';
import { CutsceneDirector } from '../core/CutsceneDirector';
import { StoryProgress } from '../core/StoryProgress';
import { staticKey } from '../core/characters';
import { ZONES } from '../core/zones';
import { track } from '../core/track';
import { Letterbox } from '../entities/Letterbox';

export interface CutsceneInitData { ids: string[]; then: { scene: string; data?: object } }

/** Plays a queue of cutscenes (shot lists from src/core/cutscenes.ts) back to
 *  back, then hands off to `then`. Input contract matches the v0.9.0 vignette
 *  exactly: a 600ms boot guard, then a 400ms debounce between advances (one
 *  tap/key = one shot). SKIP ends the ENTIRE current queue at once. Reduced
 *  Motion drops shake directives (everything else still plays). */
export class CutsceneScene extends Phaser.Scene {
  private queue: string[] = [];
  private then!: { scene: string; data?: object };
  private shots: Shot[] = [];
  private shotIdx = 0;
  private currentId = '';
  private live: Phaser.GameObjects.GameObject[] = [];
  private letterbox!: Letterbox;
  private createdAt = 0;
  private lastAdvanceAt = 0;
  private finished = false;
  private autoTimer?: Phaser.Time.TimerEvent;

  constructor() { super('Cutscene'); }

  init(data: CutsceneInitData): void {
    this.queue = [...data.ids];
    this.then = data.then;
    this.finished = false;
  }

  create(): void {
    this.createdAt = this.time.now;
    this.lastAdvanceAt = 0;
    this.letterbox = new Letterbox(this);
    this.letterbox.show();

    this.add.text(TUNING.width - 14, 20, 'SKIP ▸', { fontFamily: 'monospace', fontSize: '14px', color: '#888888' })
      .setOrigin(1, 0.5).setDepth(95).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => this.skipAll());

    this.input.on('pointerdown', () => this.advance());
    this.input.keyboard!.on('keydown', () => this.advance());

    this.playNext();
  }

  private playNext(): void {
    const id = this.queue.shift();
    if (!id) { this.wrapUp(); return; }
    const def = CUTSCENES.find((c) => c.id === id);
    if (!def) { this.playNext(); return; } // unknown id: skip defensively, never hang
    this.currentId = id;
    this.shots = def.shots;
    this.shotIdx = 0;
    this.renderShot();
  }

  private clearLive(): void {
    for (const o of this.live) o.destroy();
    this.live = [];
  }

  private zoneBgKey(index: number): string {
    const key = `cutscene-bg-z${index}`;
    if (this.textures.exists(key)) return key;
    const zone = ZONES[index];
    const top = Phaser.Display.Color.ValueToColor(zone.bgTop);
    const bot = Phaser.Display.Color.ValueToColor(zone.bgBottom);
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    const h = TUNING.height;
    for (let y = 0; y < h; y++) {
      const t = y / (h - 1);
      const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 100, t * 100);
      g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
      g.fillRect(0, y, TUNING.width, 1);
    }
    g.generateTexture(key, TUNING.width, h);
    g.destroy();
    return key;
  }

  private ensurePx4(): void {
    if (this.textures.exists('px4')) return;
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1).fillRect(0, 0, 4, 4);
    g.generateTexture('px4', 4, 4);
    g.destroy();
  }

  private actorTexture(key: ActorKey): string {
    if (key === 'titan') return 'boss-titan';
    if (key === 'spark') return 'px4';
    return staticKey(key); // 'ember' | 'cole'
  }

  private actorBaseSize(key: ActorKey): [number, number] {
    if (key === 'titan') return [140, 140];
    if (key === 'spark') return [16, 16];
    return [60, 80];
  }

  private renderShot(): void {
    this.clearLive();
    this.ensurePx4();
    const shot = this.shots[this.shotIdx];
    const reduced = save.get().settings.reducedMotion;

    if (shot.bg === 'black') {
      this.live.push(this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x05030a).setOrigin(0, 0).setDepth(0));
    } else if (shot.bgZone !== undefined) {
      this.live.push(this.add.image(0, 0, this.zoneBgKey(shot.bgZone)).setOrigin(0, 0).setDepth(0));
    }
    if (shot.lavaStrip) {
      this.live.push(this.add.tileSprite(TUNING.width / 2, TUNING.height - 20, TUNING.width, 40, 'lava').setDepth(1));
    }
    if (shot.particles === 'embers') {
      this.live.push(this.add.particles(0, TUNING.height, 'px4', {
        x: { min: 0, max: TUNING.width }, speedY: { min: -40, max: -15 }, speedX: { min: -6, max: 6 },
        lifespan: 3000, scale: { start: 0.8, end: 0 }, alpha: { start: 0.5, end: 0 },
        tint: [0xff8a3d, 0xff4d00, 0xffd166], frequency: 160,
      }).setDepth(2));
    }
    for (const burst of shot.bursts ?? []) {
      const em = this.add.particles(0, 0, 'px4', {
        speed: { min: 40, max: 140 }, lifespan: 500, scale: { start: 1.4, end: 0 }, tint: burst.tint, emitting: false,
      }).setDepth(6);
      em.explode(burst.count, burst.x, burst.y);
      this.live.push(em);
    }
    for (const actor of shot.actors ?? []) {
      const texKey = this.actorTexture(actor.key);
      const [bw, bh] = this.actorBaseSize(actor.key);
      const scale = actor.scale ?? 1;
      const img = this.add.image(actor.x, actor.y, texKey).setDepth(5)
        .setDisplaySize(bw * scale, bh * scale);
      if (actor.flipX) img.setFlipX(true);
      if (actor.key === 'spark') img.setTint(0xffd166);
      const restAlpha = actor.alpha ?? 1;
      if (actor.enterFrom) {
        img.setPosition(actor.enterFrom.x ?? actor.x, actor.enterFrom.y ?? actor.y);
        img.setAlpha(actor.enterFrom.alpha ?? restAlpha);
        this.tweens.add({
          targets: img, x: actor.x, y: actor.y, alpha: restAlpha,
          duration: shot.holdMs, ease: 'Sine.easeInOut',
        });
      } else if (actor.moveTo) {
        img.setAlpha(restAlpha);
        this.tweens.add({
          targets: img,
          x: actor.moveTo.x ?? actor.x, y: actor.moveTo.y ?? actor.y,
          alpha: actor.moveTo.alpha ?? restAlpha,
          duration: shot.holdMs, ease: 'Sine.easeInOut',
        });
      } else {
        img.setAlpha(restAlpha);
      }
      this.live.push(img);
    }
    for (const t of shot.text ?? []) {
      const txt = this.add.text(TUNING.width / 2, t.y, t.content, {
        fontFamily: 'monospace', fontSize: `${t.sizePx ?? 17}px`, color: t.color ?? '#e8e2d8',
        align: 'center', lineSpacing: 8, wordWrap: { width: 520 },
      }).setOrigin(0.5).setAlpha(0).setDepth(10);
      this.tweens.add({ targets: txt, alpha: 1, duration: 500, delay: t.delayMs ?? 0 });
      this.live.push(txt);
    }
    if (shot.shake && !reduced && save.get().settings.screenShake) {
      const intensity = shot.shake === 'big' ? 0.012 : 0.004;
      const duration = shot.shake === 'big' ? 250 : 80;
      this.cameras.main.shake(duration, intensity);
    }
    for (const key of shot.sfx ?? []) {
      this.sound.play(key, { volume: 0.5 * (save.get().settings.sfxVol / 10) });
    }

    this.autoTimer = this.time.delayedCall(shot.holdMs, () => this.advance());
  }

  private advance(): void {
    if (this.finished) return;
    const now = this.time.now;
    if (now - this.createdAt < 600) return;
    if (now - this.lastAdvanceAt < 400) return;
    this.lastAdvanceAt = now;
    this.nextShot();
  }

  private nextShot(): void {
    this.autoTimer?.remove();
    this.shotIdx += 1;
    if (this.shotIdx >= this.shots.length) {
      this.finishCurrent(false);
      return;
    }
    this.renderShot();
  }

  private finishCurrent(skipped: boolean): void {
    track('cutscene', { id: this.currentId, skipped });
    new CutsceneDirector(save).markWatched(this.currentId);
    if (this.currentId === 'opening') new StoryProgress(save).onVignetteSeen();
    this.playNext();
  }

  /** SKIP ends the WHOLE current queue (not just the current cutscene). */
  private skipAll(): void {
    if (this.finished) return;
    this.autoTimer?.remove();
    const remaining = [this.currentId, ...this.queue];
    const director = new CutsceneDirector(save);
    for (const id of remaining) {
      track('cutscene', { id, skipped: true });
      director.markWatched(id);
    }
    if (remaining.includes('opening')) new StoryProgress(save).onVignetteSeen();
    this.queue = [];
    this.wrapUp();
  }

  private wrapUp(): void {
    if (this.finished) return;
    this.finished = true;
    this.clearLive();
    this.letterbox.hide(200, () => this.letterbox.destroy());
    this.scene.start(this.then.scene, this.then.data);
  }
}
