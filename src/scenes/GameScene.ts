import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { Player } from '../entities/Player';
import { LevelStream } from '../core/LevelStream';
import { PlatformManager } from '../entities/PlatformManager';
import { CoinManager } from '../entities/CoinManager';
import { Lava } from '../entities/Lava';
import { ScoreTracker } from '../core/ScoreTracker';
import { save } from '../main';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private stream!: LevelStream;
  private platforms!: PlatformManager;
  private coins!: CoinManager;
  private lava!: Lava;
  private score = new ScoreTracker();
  private dead = false;
  private bgFar!: Phaser.GameObjects.TileSprite;
  private bgNear!: Phaser.GameObjects.TileSprite;

  constructor() { super('Game'); }

  /** Build two procedural parallax background textures (no external assets). */
  private buildBackground(): void {
    const w = TUNING.width;
    const h = TUNING.height;

    if (!this.textures.exists('bg-far')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      // Deep purple -> navy vertical gradient.
      const top = Phaser.Display.Color.ValueToColor(0x140820);
      const bot = Phaser.Display.Color.ValueToColor(0x05030f);
      for (let y = 0; y < h; y++) {
        const t = y / (h - 1);
        const c = Phaser.Display.Color.Interpolate.ColorWithColor(top, bot, 100, t * 100);
        g.fillStyle(Phaser.Display.Color.GetColor(c.r, c.g, c.b), 1);
        g.fillRect(0, y, w, 1);
      }
      // A few faint stars.
      const rnd = new Phaser.Math.RandomDataGenerator(['lavaleap-bg-far']);
      for (let i = 0; i < 70; i++) {
        const x = rnd.between(0, w - 1);
        const y = rnd.between(0, h - 1);
        const a = rnd.realInRange(0.15, 0.5);
        g.fillStyle(0x9aa6ff, a);
        g.fillRect(x, y, 1, 1);
      }
      g.generateTexture('bg-far', w, h);
      g.destroy();
    }

    if (!this.textures.exists('bg-near')) {
      const g = this.make.graphics({ x: 0, y: 0 }, false);
      // Mostly transparent layer of lighter scattered specks / dust.
      const rnd = new Phaser.Math.RandomDataGenerator(['lavaleap-bg-near']);
      for (let i = 0; i < 110; i++) {
        const x = rnd.between(0, w - 1);
        const y = rnd.between(0, h - 1);
        const a = rnd.realInRange(0.08, 0.28);
        const size = rnd.between(1, 2);
        g.fillStyle(0x6b5a8a, a);
        g.fillRect(x, y, size, size);
      }
      g.generateTexture('bg-near', w, h);
      g.destroy();
    }

    this.bgFar = this.add.tileSprite(0, 0, w, h, 'bg-far')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-10);
    this.bgNear = this.add.tileSprite(0, 0, w, h, 'bg-near')
      .setOrigin(0, 0).setScrollFactor(0).setDepth(-9);
  }

  create(): void {
    this.score = new ScoreTracker();
    this.dead = false;
    // Reset HUD-facing values so a retry can't flash the previous run's score.
    this.registry.set('height', 0);
    this.registry.set('coins', 0);

    this.buildBackground();

    this.stream = new LevelStream(Math.floor(Math.random() * 1e9));
    this.platforms = new PlatformManager(this);

    // Spawn the initial platform(s).
    for (const p of this.stream.active) this.platforms.spawn(p);

    this.player = new Player(this, TUNING.playerStartX, TUNING.groundY - 40);
    this.physics.add.collider(this.player.sprite, this.platforms.group);

    this.coins = new CoinManager(this);
    for (const p of this.stream.active) this.coins.spawn(p);
    this.physics.add.overlap(this.player.sprite, this.coins.group, (_pl, coin) => {
      (coin as Phaser.GameObjects.Image).destroy();
      this.onCoin();
    });

    this.lava = new Lava(this);

    this.cameras.main.setBounds(0, -1_000_000, TUNING.width, 1_000_000 + TUNING.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.12);
    this.cameras.main.setDeadzone(TUNING.width, 180);

    this.scene.launch('Hud');
  }

  update(time: number, delta: number): void {
    this.player.update();
    this.platforms.update(time);

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

    const body = this.player.sprite.body as Phaser.Physics.Arcade.Body;
    if (body.blocked.down) {
      const id = this.platforms.platformUnder(this.player.sprite);
      if (id !== null) this.platforms.touch(id, time);
    }

    const heightClimbed = Math.max(0, TUNING.groundY - this.player.sprite.y);
    this.score.updateHeight(heightClimbed);
    this.registry.set('height', Math.floor(this.score.maxHeight));
    this.registry.set('coins', this.score.coins);

    this.lava.update(delta, heightClimbed);
    if (!this.dead && this.lava.catches(this.player.sprite.y)) {
      this.dead = true;
      this.sound.play('sfx-death', { volume: 0.6 });
      const finalScore = this.score.score;
      if (finalScore > save.get().highScore) save.update((b) => { b.highScore = finalScore; });
      this.scene.stop('Hud');
      this.scene.start('GameOver', { score: finalScore });
    }

    const maxScroll = TUNING.groundY + TUNING.height / 2 - TUNING.height;
    if (this.cameras.main.scrollY > maxScroll) this.cameras.main.scrollY = maxScroll;
  }

  private onCoin(): void {
    this.score.addCoin();
    this.sound.play('sfx-coin', { volume: 0.5 });
  }
}
