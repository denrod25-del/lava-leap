import Phaser from 'phaser';
import { TUNING, POWERUP, COMBO_POINTS, powerupDurationFactor } from '../tuning';
import { Player } from '../entities/Player';
import { LevelStream } from '../core/LevelStream';
import { PlatformManager } from '../entities/PlatformManager';
import { CoinManager } from '../entities/CoinManager';
import { Lava } from '../entities/Lava';
import { ScoreTracker } from '../core/ScoreTracker';
import { ComboTracker } from '../core/ComboTracker';
import { FlowMeter, combinedMultiplier } from '../core/FlowMeter';
import { save } from '../main';
import { GameEvents } from '../core/events';
import { JuiceController } from '../entities/JuiceController';
import { AudioDirector } from '../entities/AudioDirector';
import { zoneForHeight, ZONES, type ZoneDef } from '../core/zones';
import { AchievementTracker } from '../core/AchievementTracker';
import { recordRunStart, recordDeath, recordBank } from '../core/analytics';
import { dailySeed, dateKey } from '../core/dailySeed';
import { KeyboardInput } from '../entities/input/KeyboardInput';
import { TouchSteerInput } from '../entities/input/TouchSteerInput';
import { EnemyManager } from '../entities/EnemyManager';
import { PowerupController } from '../entities/PowerupController';
import { BossController } from '../entities/BossController';
import { TutorialOverlay } from '../entities/TutorialOverlay';
import { bossBoundaryCrossed } from '../core/boss';
import { track } from '../core/track';
import { BOSS_TEMPLATES } from '../core/bossTemplates';
import { DevOverlay } from '../entities/DevOverlay';
import type { InputSource } from '../core/InputState';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private inputSrc!: InputSource;
  private stream!: LevelStream;
  private platforms!: PlatformManager;
  private coins!: CoinManager;
  private lava!: Lava;
  private score = new ScoreTracker();
  private combo!: ComboTracker;
  private flow!: FlowMeter;
  private peakFlowTier = 0;
  private dead = false;
  private booked = false;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;
  private gameEvents!: GameEvents;
  private juice!: JuiceController;
  private audio!: AudioDirector;
  private zoneIndex = 0;
  private tracker!: AchievementTracker;
  private enemies!: EnemyManager;
  private powerups!: PowerupController;
  private boss!: BossController;
  private tutorial?: TutorialOverlay;
  private runSeed = 0;
  private prevHeight = 0;
  private revivedThisRun = false;
  public daily = false;
  private dateKeyToday = '';
  private devOverlay?: DevOverlay;

  constructor() { super('Game'); }

  init(data: { daily?: boolean }): void {
    this.daily = data?.daily === true;
  }

  private bgKeys(zone: ZoneDef): { far: string; near: string } {
    return { far: `bg-far-z${zone.index}`, near: `bg-near-z${zone.index}` };
  }

  /** Build two procedural parallax background textures for the given zone. */
  private buildBackground(zone: ZoneDef): void {
    const w = TUNING.width;
    const h = TUNING.height;
    const { far, near } = this.bgKeys(zone);

    if (!this.textures.exists(far)) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const top = Phaser.Display.Color.ValueToColor(zone.bgTop);
      const bot = Phaser.Display.Color.ValueToColor(zone.bgBottom);
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 100, t * 100);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
        g.fillRect(0, y, w, 1);
      }
      // A few faint stars tinted per-zone.
      const rnd = new Phaser.Math.RandomDataGenerator([`lavaleap-${far}`]);
      for (let i = 0; i < 70; i++) {
        const x = rnd.between(0, w - 1);
        const y = rnd.between(0, h - 1);
        const a = rnd.realInRange(0.15, 0.5);
        g.fillStyle(zone.starTint, a);
        g.fillRect(x, y, 1, 1);
      }
      g.generateTexture(far, w, h);
      g.destroy();
    }

    if (!this.textures.exists(near)) {
      // Scattered specks / dust tinted per-zone.
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      const rnd = new Phaser.Math.RandomDataGenerator([`lavaleap-${near}`]);
      for (let i = 0; i < 110; i++) {
        const x = rnd.between(0, w - 1);
        const y = rnd.between(0, h - 1);
        const a = rnd.realInRange(0.08, 0.28);
        const size = rnd.between(1, 2);
        g.fillStyle(zone.starTint, a * 0.5);
        g.fillRect(x, y, size, size);
      }
      g.generateTexture(near, w, h);
      g.destroy();
    }
  }

  private crossfadeBg(farKey: string, nearKey: string): void {
    const oldFar = this.bgFar, oldNear = this.bgNear;
    this.bgFar = this.add.tileSprite(0, 0, TUNING.width, TUNING.height, farKey)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10).setAlpha(0);
    this.bgNear = this.add.tileSprite(0, 0, TUNING.width, TUNING.height, nearKey)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-9).setAlpha(0);
    this.tweens.add({
      targets: [this.bgFar, this.bgNear], alpha: 1, duration: 1200,
      onComplete: () => { oldFar.destroy(); oldNear.destroy(); },
    });
  }

  create(): void {
    this.gameEvents = new GameEvents();
    this.score = new ScoreTracker();
    this.combo = new ComboTracker();
    this.dead = false;
    this.booked = false;
    this.revivedThisRun = false;
    this.zoneIndex = 0;
    this.prevHeight = 0;
    // Reset HUD-facing values so a retry can't flash the previous run's score.
    this.registry.set('height', 0);
    this.registry.set('coins', 0);
    this.registry.set('combo', { multiplier: 1, remaining01: 0 });
    this.registry.set('powerup', { kind: null, shield: false, remainMs: 0 });
    this.flow = new FlowMeter();
    this.peakFlowTier = 0;
    this.registry.set('flow', { value: 0, tier: 0, name: 'COOL', multiplier: 1 });

    this.dateKeyToday = dateKey(new Date());
    save.update((b) => recordRunStart(b.analytics, this.daily));
    this.tracker = new AchievementTracker(this.gameEvents, save, (a) => {
      this.registry.set('toast', `${a.name} — ${a.description}`);
      this.sound.play('sfx-ding', { volume: 0.5 * (save.get().settings.sfxVol / 10) });
    });

    this.buildBackground(ZONES[0]);
    const zone0Keys = this.bgKeys(ZONES[0]);
    this.bgFar = this.add.tileSprite(0, 0, TUNING.width, TUNING.height, zone0Keys.far)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    this.bgNear = this.add.tileSprite(0, 0, TUNING.width, TUNING.height, zone0Keys.near)
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-9);

    const seed = this.daily ? dailySeed(new Date()) : Math.floor(Math.random() * 1e9);
    this.runSeed = seed;
    this.stream = new LevelStream(seed);
    this.platforms = new PlatformManager(this, this.gameEvents);

    // Spawn the initial platform(s).
    for (const p of this.stream.active) this.platforms.spawn(p);

    this.player = new Player(this, TUNING.playerStartX, TUNING.groundY - 40, this.gameEvents);
    // Touch supplies a follow-finger steer target + JUMP/DASH buttons; keyboard supplies
    // keys. Player.update() reads whichever and runs the SAME manual moveset for both.
    const wantTouch = this.sys.game.device.input.touch || navigator.maxTouchPoints > 0;
    this.inputSrc = wantTouch ? new TouchSteerInput(this) : new KeyboardInput(this);
    // Touch climbing is harder, so grant a triple jump (ground + 2 air); keyboard stays double.
    this.player.maxJumps = wantTouch ? 3 : 2;
    // First-run tutorial (once ever; Settings can reset the flag).
    this.tutorial = undefined;
    if (!save.get().tutorialDone) {
      this.tutorial = new TutorialOverlay(this, this.gameEvents, wantTouch, () => {
        save.update((b) => { b.tutorialDone = true; });
      });
    }
    track('start_game', { daily: this.daily, control_type: wantTouch ? 'touch' : 'keyboard' });
    this.physics.add.collider(this.player.sprite, this.platforms.group);

    this.coins = new CoinManager(this);
    for (const p of this.stream.active) this.coins.spawn(p);
    this.physics.add.overlap(this.player.sprite, this.coins.group, (_pl, coin) => {
      const c = coin as Phaser.GameObjects.Image;
      this.gameEvents.emit('coinCollected', { x: c.x, y: c.y });
      c.destroy();
      this.onCoin();
    });

    this.enemies = new EnemyManager(this, this.gameEvents);
    for (const p of this.stream.active) this.enemies.spawn(p);

    this.powerups = new PowerupController(this, this.gameEvents);
    for (const p of this.stream.active) this.powerups.spawn(p);
    this.powerups.registerPlayerOverlap(this.player.sprite);

    // Apply meta-progression upgrade effects for this run.
    const up = save.get().upgrades;
    this.powerups.setDurationFactor(powerupDurationFactor(up.powerupDuration));
    if (up.startShield > 0) {
      this.powerups.hasShield = true;
      this.registry.set('powerup', this.powerups.hudState);
    }

    this.lava = new Lava(this);

    this.boss = new BossController(this, this.gameEvents);
    this.boss.registerPlayerOverlap(this.player.sprite, () => {
      if (this.player.invulnerable) return; // dash i-frames: fireballs pass through
      this.gameEvents.emit('playerHit', { source: 'boss' });
      this.handleHit('boss');
    });

    this.gameEvents.on('enemyStomped', () => this.comboAction(COMBO_POINTS.stomp));
    this.gameEvents.on('bouncePad', () => this.comboAction(COMBO_POINTS.bounce));
    this.gameEvents.on('powerupCollected', () => this.comboAction(COMBO_POINTS.powerup));
    this.gameEvents.on('bossPhase', ({ zoneIndex, phase }) => {
      track(phase === 'start' ? 'boss_start' : 'boss_clear', { index: zoneIndex });
    });

    // Flow chain beats: each aggressive action bumps the meter.
    this.gameEvents.on('dash', () => this.flow.beat());
    this.gameEvents.on('dashJumpCancel', () => this.flow.beat());
    this.gameEvents.on('coinCollected', () => this.flow.beat());
    this.gameEvents.on('enemyStomped', () => this.flow.beat());
    this.gameEvents.on('bouncePad', () => this.flow.beat());

    this.juice = new JuiceController(this, this.gameEvents, save, this.player.sprite, this.lava);
    this.audio = new AudioDirector(this, this.gameEvents, save);

    this.cameras.main.setBounds(0, -1_000_000, TUNING.width, 1_000_000 + TUNING.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.12);
    this.cameras.main.setDeadzone(TUNING.width, 180);

    this.scene.launch('Hud');

    this.input.keyboard!.on('keydown-ESC', () => this.pauseGame());
    this.input.keyboard!.on('keydown-P', () => this.pauseGame());

    if (import.meta.env.DEV) this.devOverlay = new DevOverlay(this);
  }

  update(time: number, delta: number): void {
    const sampled = this.inputSrc.sample();
    this.player.update(sampled);
    // Flow: build while airborne/dashing, drain when camping on the ground.
    const pbody = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    const grounded = pbody.blocked.down || pbody.touching.down;
    const prevTier = this.flow.tier;
    this.flow.update(delta, !grounded, this.player.dashing);
    if (this.flow.tier !== prevTier) {
      this.gameEvents.emit('flowTier', { tier: this.flow.tier, name: this.flow.tierName });
    }
    this.peakFlowTier = Math.max(this.peakFlowTier, this.flow.tier);
    this.player.flowSpeedNudge = this.flow.speedNudge;
    this.registry.set('flow', {
      value: this.flow.value, tier: this.flow.tier,
      name: this.flow.tierName, multiplier: this.flow.heatMultiplier,
    });
    this.tutorial?.update(sampled, delta);
    if (sampled.pausePressed) this.pauseGame();
    this.platforms.update(time);
    this.audio.update(this.lava.surfaceY - (this.player.sprite.y + 16), this.player.wallSliding);

    // Parallax: scroll background layers at fractions of the camera.
    this.bgFar.tilePositionY = this.cameras.main.scrollY * 0.2;
    this.bgNear.tilePositionY = this.cameras.main.scrollY * 0.5;

    const cameraTopY = this.cameras.main.scrollY;
    const pruneBelowY = this.cameras.main.scrollY + TUNING.height + 100;
    const { added, removed } = this.stream.update(cameraTopY, pruneBelowY);
    for (const p of added) this.platforms.spawn(p);
    for (const p of removed) this.platforms.despawn(p);
    for (const p of added) this.coins.spawn(p);
    for (const p of removed) this.coins.despawn(p);
    for (const p of added) this.enemies.spawn(p);
    for (const p of removed) this.enemies.despawn(p);
    for (const p of added) this.powerups.spawn(p);
    for (const p of removed) this.powerups.despawn(p);

    this.enemies.update(time, delta);

    // Apply active power-up effects this frame.
    const fx = this.powerups.update(delta);
    if (fx.rocket) this.player.applyRocket();
    if (fx.magnet) this.coins.attractTo(this.player.sprite, POWERUP.magnetRadius, POWERUP.magnetPull, delta);
    this.juice.update(fx.magnet, delta);
    this.juice.updateFlow(this.flow.tier, this.player.dashing, delta);
    this.lava.setSpeedFactor(fx.slowLava ? POWERUP.slowLavaFactor : 1);
    this.registry.set('powerup', this.powerups.hudState);

    // Enemy contact resolution (stomp / dash-kill / lethal). The manager emits
    // enemyStomped itself on any kill, so the stomp callback just bounces the player.
    if (!this.dead) {
      this.enemies.resolveContact(
        this.player.sprite,
        () => this.player.dashing,
        () => {
          this.gameEvents.emit('playerHit', { source: 'enemy' });
          this.handleHit('enemy');
        },
        () => this.player.stompBounce(),
      );
    }

    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      const desc = this.platforms.descriptorUnder(this.player.sprite);
      if (desc !== null) this.platforms.touch(desc.id, time);
      if (desc?.bounce) {
        this.player.bounce();
        this.gameEvents.emit('bouncePad', { x: this.player.sprite.x, y: this.player.sprite.y });
      }
    }

    const heightClimbed = Math.max(0, TUNING.groundY - this.player.sprite.y);
    // Flow heat: new height gained this frame earns (heatMultiplier − 1) extra points.
    this.score.addHeatBonus(Math.max(0, heightClimbed - this.score.maxHeight), this.flow.heatMultiplier);
    this.score.updateHeight(heightClimbed);
    this.registry.set('height', Math.floor(this.score.maxHeight));
    this.registry.set('coins', this.score.coins);

    if (this.combo.update(delta)) {
      this.gameEvents.emit('comboChanged', { multiplier: this.combo.multiplier });
    }
    this.registry.set('combo', { multiplier: this.combo.multiplier, remaining01: this.combo.remaining01 });

    // Zone tracking — crossfade background and emit event on zone change.
    const zone = zoneForHeight(heightClimbed);
    if (zone.index !== this.zoneIndex) {
      this.zoneIndex = zone.index;
      this.buildBackground(zone);
      const keys = this.bgKeys(zone);
      this.crossfadeBg(keys.far, keys.near);
      this.gameEvents.emit('zoneEntered', { zoneIndex: zone.index, name: zone.name });
      this.registry.set('zoneBanner', zone.name);
    }

    this.tracker.updateHeight(Math.floor(heightClimbed), this.zoneIndex);

    this.lava.update(delta, heightClimbed);

    // Lava Titan boss: trigger once per boundary crossing, then run each frame.
    if (!this.boss.isActive) {
      const idx = bossBoundaryCrossed(this.prevHeight, heightClimbed);
      if (idx >= 0) {
        this.stream.injectChunk(BOSS_TEMPLATES[idx]);
        this.boss.start(idx, this.runSeed, this.lava.surfaceY);
      }
    }
    this.boss.update(delta, this.lava.surfaceY);
    this.prevHeight = heightClimbed;

    if (!this.dead && this.lava.catches(this.player.sprite.y)) {
      this.triggerDeath('lava');
    }

    const maxScroll = TUNING.groundY + TUNING.height / 2 - TUNING.height;
    if (this.cameras.main.scrollY > maxScroll) this.cameras.main.scrollY = maxScroll;

    this.devOverlay?.update();
  }

  private handleHit(source: 'enemy' | 'boss'): void {
    if (this.dead) return;
    if (this.powerups.absorbHit()) return; // shield saved you
    this.triggerDeath(source);
  }

  private triggerDeath(source = 'unknown'): void {
    if (this.dead) return;

    if (!this.revivedThisRun && save.get().upgrades.revive > 0) {
      this.revivedThisRun = true;
      // Lift the player back to safety above the lava, with a fresh shield + brief grace.
      const safeY = this.lava.surfaceY - 220;
      const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
      body.reset(TUNING.playerStartX, safeY);
      this.player.sprite.setVelocity(0, 0);
      // Absorb the revive lift into maxHeight NOW (plain height, no heat bonus) so
      // the next frame's Flow heat scoring can't treat the teleport as climbed height.
      this.score.updateHeight(Math.max(0, TUNING.groundY - safeY));
      this.powerups.hasShield = true;
      this.registry.set('powerup', this.powerups.hudState);
      // Dedicated revive event for juice/sfx — NOT powerupCollected, so the revive
      // doesn't bump the combo multiplier or count as a power-up used in analytics.
      this.gameEvents.emit('playerRevived', { x: this.player.sprite.x, y: this.player.sprite.y });
      return;
    }

    this.dead = true;
    const heightClimbed = Math.max(0, TUNING.groundY - this.player.sprite.y);
    const finalScore = this.score.score;
    track('death', { height: Math.floor(heightClimbed), zone: this.zoneIndex, source, peak_flow: this.peakFlowTier });
    if (finalScore > save.get().highScore) save.update((b) => { b.highScore = finalScore; });
    this.gameEvents.emit('death', { height: Math.floor(heightClimbed), zoneIndex: this.zoneIndex });
    this.time.delayedCall(450, () => {
      const { banked, bankTotal } = this.endRunBookkeeping(Math.floor(heightClimbed));
      save.update((b) => recordDeath(b.analytics, Math.floor(heightClimbed), this.zoneIndex, source));
      this.scene.stop('Hud');
      this.scene.start('GameOver', {
        score: finalScore,
        banked, bankTotal,
        daily: this.daily,
        dailyBest: this.daily ? save.get().dailyBest[this.dateKeyToday] ?? 0 : 0,
        earned: [...this.tracker.earnedThisRun],
      });
    });
  }

  private pauseGame(): void {
    if (this.dead || this.scene.isPaused()) return;
    this.scene.launch('Pause');
    this.scene.pause();
  }

  /** Banks run coins + records analytics. Used by death, quit, and restart. */
  public endRunBookkeeping(finalHeight: number): { banked: number; bankTotal: number } {
    if (this.booked) return { banked: 0, bankTotal: save.get().coinBank };
    this.booked = true;
    const banked = this.score.coins;
    save.update((b) => {
      b.coinBank += banked;
      recordBank(b.analytics, banked);
    });
    if (this.daily) {
      const key = this.dateKeyToday;
      const sc = this.score.score;
      save.update((b) => { if (sc > (b.dailyBest[key] ?? 0)) b.dailyBest[key] = sc; });
    }
    void finalHeight;
    return { banked, bankTotal: save.get().coinBank };
  }

  private onCoin(): void {
    this.score.addCoin();
    this.player.refreshDash(); // mid-air coin grab refreshes the dash (chain enabler)
    this.comboAction(COMBO_POINTS.coin);
  }

  /** Register a combo action: bump the multiplier, award multiplied bonus, sync HUD. */
  private comboAction(basePoints: number): void {
    this.combo.bump();
    // Flow × Combo, capped — "Flow = how you climb, Combo = what you grab."
    const combined = combinedMultiplier(this.combo.multiplier, this.flow.heatMultiplier);
    this.score.addBonus(Math.floor(basePoints * combined));
    this.gameEvents.emit('comboChanged', { multiplier: this.combo.multiplier });
    this.registry.set('combo', { multiplier: this.combo.multiplier, remaining01: this.combo.remaining01 });
  }
}
