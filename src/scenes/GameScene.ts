import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { Player } from '../entities/Player';

export class GameScene extends Phaser.Scene {
  private player!: Player;

  constructor() { super('Game'); }

  create(): void {
    // Temporary static ground so the player has something to stand on.
    const ground = this.physics.add.staticGroup();
    const g = this.add.rectangle(TUNING.width / 2, TUNING.groundY + 8, 200, 16, 0x6abe30);
    this.physics.add.existing(g, true);
    ground.add(g);

    this.player = new Player(this, TUNING.playerStartX, TUNING.groundY - 40);
    this.physics.add.collider(this.player.sprite, ground);

    // Camera: world is tall and grows upward (negative y). Follow only upward.
    this.cameras.main.setBounds(0, -1_000_000, TUNING.width, 1_000_000 + TUNING.height);
    this.cameras.main.startFollow(this.player.sprite, true, 0.1, 0.1);
    this.cameras.main.setDeadzone(TUNING.width, 200);
  }

  update(): void {
    this.player.update();
    // Lock camera so it never scrolls below its lowest point (never reveals below start).
    const maxScroll = TUNING.groundY + TUNING.height / 2 - TUNING.height;
    if (this.cameras.main.scrollY > maxScroll) this.cameras.main.scrollY = maxScroll;
  }
}
