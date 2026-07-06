import Phaser from 'phaser';
import { TUNING } from '../tuning';
import { save, leaderboard } from '../main';
import { allTimeBoard, dailyBoard, type LeaderboardEntry } from '../core/leaderboard';
import { track } from '../core/track';

export class LeaderboardScene extends Phaser.Scene {
  private tab: 'alltime' | 'daily' = 'alltime';
  private listText!: Phaser.GameObjects.Text;
  private statusText!: Phaser.GameObjects.Text;
  private tabText!: Phaser.GameObjects.Text;

  constructor() { super('Leaderboard'); }

  create(): void {
    const cx = TUNING.width / 2;
    this.add.rectangle(0, 0, TUNING.width, TUNING.height, 0x0e0e1a, 1).setOrigin(0, 0);
    this.add.text(cx, 60, 'LEADERBOARD', { fontFamily: 'monospace', fontSize: '30px', color: '#ffb066' }).setOrigin(0.5);

    this.tabText = this.add.text(cx, 104, '', { fontFamily: 'monospace', fontSize: '15px', color: '#16e0e0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true })
      .on('pointerdown', () => { this.tab = this.tab === 'alltime' ? 'daily' : 'alltime'; this.refresh(); });

    this.statusText = this.add.text(cx, 360, '', { fontFamily: 'monospace', fontSize: '15px', color: '#8a93a3' }).setOrigin(0.5);
    this.listText = this.add.text(cx, 140, '', { fontFamily: 'monospace', fontSize: '14px', color: '#cfd8e3', align: 'left', lineSpacing: 6 }).setOrigin(0.5, 0);

    const back = (): void => { this.scene.start('Menu'); }; // scene.start STOPS this scene — required, or black screen
    this.add.text(cx, 640, '[ BACK ]', { fontFamily: 'monospace', fontSize: '20px', color: '#16e0e0' })
      .setOrigin(0.5).setInteractive({ useHandCursor: true }).on('pointerdown', back);
    this.input.keyboard!.once('keydown-ESC', back);
    this.input.keyboard!.on('keydown-T', () => { this.tab = this.tab === 'alltime' ? 'daily' : 'alltime'; this.refresh(); });

    this.refresh();
  }

  private board(): string { return this.tab === 'alltime' ? allTimeBoard() : dailyBoard(new Date()); }

  private refresh(): void {
    this.tabText.setText(this.tab === 'alltime' ? '‹ ALL-TIME ›   (T / tap: today’s daily)' : '‹ TODAY’S DAILY ›   (T / tap: all-time)');
    this.listText.setText('');
    this.statusText.setText('Loading…');
    track('leaderboard_view', { board: this.tab });
    const myId = save.get().identity.playerId;
    const requested = this.tab; // guard against a tab flip while the fetch is in flight
    void leaderboard.top(this.board(), 50).then((rows) => {
      if (!this.statusText.active || requested !== this.tab) return; // scene gone or stale response
      if (rows.length === 0) {
        this.statusText.setText(leaderboard.enabled ? 'Be the first to post a score!' : 'Leaderboards are offline.');
        return;
      }
      this.statusText.setText('');
      // 50 rows would overflow the 720px canvas at ~20px/row, so only the top 24 are
      // rendered directly. If the player's own entry falls outside that slice (rank 25-50,
      // reachable since we fetch top(board, 50)), pin it at the bottom after a separator
      // so the player can always find themselves without scrolling (not implemented here).
      const shown = rows.slice(0, 24);
      const lines = shown.map((r) => this.row(r, myId));
      if (!shown.some((r) => r.playerId === myId)) {
        const mine = rows.find((r) => r.playerId === myId);
        if (mine) {
          lines.push('   ···');
          lines.push(this.row(mine, myId));
        }
      }
      this.listText.setText(lines.join('\n'));
    });
  }

  private row(r: LeaderboardEntry, myId: string): string {
    const you = r.playerId === myId ? ' ◀ YOU' : '';
    const rank = String(r.rank).padStart(2, ' ');
    const name = r.name.slice(0, 12).padEnd(12, ' ');
    const score = String(r.score).padStart(7, ' ');
    return `${rank}  ${name} ${score}${you}`;
  }
}
