import Phaser from 'phaser';
import { GameEvents } from '../core/events';
import type { SaveData } from '../core/SaveData';

/** Owns all in-run audio: event one-shots, rumble/scrape loops, the game music loop. */
export class AudioDirector {
  private music: Phaser.Sound.BaseSound;
  private rumble: Phaser.Sound.BaseSound;
  private scrape: Phaser.Sound.BaseSound;
  private scrapeOn = false;

  constructor(private scene: Phaser.Scene, events: GameEvents, private save: SaveData) {
    // Take over the soundscape: stops the menu music (nothing else stops it on
    // Menu -> Game) and any lingering one-shots before starting run audio.
    scene.sound.stopAll();
    this.music = scene.sound.add('sfx-music-game', { loop: true });
    this.rumble = scene.sound.add('sfx-rumble', { loop: true, volume: 0 });
    this.scrape = scene.sound.add('sfx-scrape', { loop: true, volume: 0 });
    this.music.play({ volume: this.musicVol() });
    this.rumble.play();
    this.scrape.play();

    events.on('jump', () => this.sfx('sfx-jump', 0.4));
    events.on('doubleJump', () => this.sfx('sfx-jump', 0.35));
    events.on('wallJump', () => this.sfx('sfx-jump', 0.45));
    // flowTier() reads the registry, which GameScene refreshes every frame — so these
    // detunes can be one frame (≤16ms) stale after a tier change. Intentional: inaudible,
    // and the tier-up stings below use the event payload, never the registry.
    events.on('dash', () => this.sfxDetuned('sfx-ui-select', 0.3, this.flowTier() * 150));
    events.on('dashJumpCancel', () => this.sfxDetuned('sfx-jump', 0.45, 200 + this.flowTier() * 150));
    events.on('flowTier', ({ tier }) => {
      if (tier > this.lastFlowTier) {
        this.sfxDetuned('sfx-ding', 0.4, tier * 250); // rising pitch per tier
        if (tier === 3) this.sfx('sfx-swell', 0.5);   // Blazing "on fire" sting
      }
      this.lastFlowTier = tier;
    });
    events.on('coinCollected', () => this.sfx('sfx-coin', 0.5));
    events.on('platformCrumble', () => this.sfx('sfx-crack', 0.5));
    events.on('zoneEntered', () => this.sfx('sfx-swell', 0.5));
    events.on('death', () => this.sfx('sfx-death', 0.6));
    events.on('enemyStomped', () => this.sfx('sfx-stomp', 0.55));
    events.on('playerHit', () => this.sfx('sfx-hit', 0.6));
    events.on('bouncePad', () => this.sfx('sfx-jump', 0.5));
    events.on('powerupCollected', () => this.sfx('sfx-pickup', 0.6));
    events.on('powerupExpired', () => this.sfx('sfx-expire', 0.4));
    events.on('bossPhase', ({ phase }) => { if (phase === 'start') this.sfx('sfx-boss-roar', 0.7); });
    events.on('projectileLaunched', () => this.sfx('sfx-projectile', 0.45));
    events.on('playerRevived', () => this.sfx('sfx-pickup', 0.7));

    scene.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.destroy());
  }

  private lastFlowTier = 0;

  private musicVol(): number { return (this.save.get().settings.musicVol / 10) * 0.8; }
  private sfxMult(): number { return this.save.get().settings.sfxVol / 10; }

  private sfx(key: string, base: number): void {
    this.scene.sound.play(key, { volume: base * this.sfxMult() });
  }

  private flowTier(): number {
    return (this.scene.registry.get('flow') as { tier?: number } | undefined)?.tier ?? 0;
  }

  private sfxDetuned(key: string, base: number, detune: number): void {
    this.scene.sound.play(key, { volume: base * this.sfxMult(), detune });
  }

  /** Call each frame. lavaDistancePx = player feet to lava surface. */
  update(lavaDistancePx: number, wallSliding: boolean): void {
    (this.music as Phaser.Sound.WebAudioSound).setVolume(this.musicVol());
    const proximity = Phaser.Math.Clamp(1 - lavaDistancePx / 600, 0, 1);
    (this.rumble as Phaser.Sound.WebAudioSound).setVolume(0.6 * proximity * this.sfxMult());
    const target = wallSliding ? 0.35 * this.sfxMult() : 0;
    if (wallSliding || wallSliding !== this.scrapeOn) {
      (this.scrape as Phaser.Sound.WebAudioSound).setVolume(target);
    }
    this.scrapeOn = wallSliding;
  }

  destroy(): void {
    this.music.stop(); this.rumble.stop(); this.scrape.stop();
    this.music.destroy(); this.rumble.destroy(); this.scrape.destroy();
  }
}
