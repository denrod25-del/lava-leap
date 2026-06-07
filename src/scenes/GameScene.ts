import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { Player } from '../entities/Player';
import { LevelStream } from '../core/LevelStream';
import { PlatformManager } from '../entities/PlatformManager';
import { CoinManager } from '../entities/CoinManager';

export class GameScene extends Phaser.Scene {
  private player!: Player;
  private stream!: LevelStream;
  private platforms!: PlatformManager;
  private coins!: CoinManager;

  constructor() { super('Game'); }

  create(): void {
    this.stream = new LevelStream(Math.floor(Math.random() * 1e9));
    this.platforms = new PlatformManager(this);

    // Spawn the initial platform(s).
    for (const p of this.stream.active) this.platforms.spawn(p);

    this.coins = new CoinManager(this);
    for (const p of this.stream.active) this.coins.spawn(p);
    this.physics.add.overlap(this.player.sprite, this.coins.group, (_pl, coin) => {
      (coin as Phaser.GameObjects.Arc).destroy();
      this.onCoin();
    });

    this.player = new Player(this, TUNING.playerStartX, TUNING.groundY - 40);
    this.physics.add.collider(this.player.sprite, this.platforms.group);

    this.cameras.main.setBounds(0, -1_000_000, TUNING.width, 1_000_000 + TUNING.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.12);
    this.cameras.main.setDeadzone(TUNING.width, 180);
  }

  update(time: number): void {
    this.player.update();
    this.platforms.update(time);

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

    const maxScroll = TUNING.groundY + TUNING.height / 2 - TUNING.height;
    if (this.cameras.main.scrollY > maxScroll) this.cameras.main.scrollY = maxScroll;
  }

  private onCoin(): void {}
}
