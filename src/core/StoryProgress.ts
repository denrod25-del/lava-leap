import { STORY_PAGES, COLE_PAGE_ID, type StoryPage, type StoryStage } from './story';
import type { SaveData } from './SaveData';

/** Pure unlock engine over SaveData. Every on*() returns the NEWLY unlocked
 *  pages (usually 0-1, plus a cascaded finale) and persists via save.update().
 *  Idempotent: re-firing an event never double-unlocks. */
export class StoryProgress {
  constructor(readonly save: SaveData) {}

  unlockedIds(): string[] { return this.save.get().story.unlockedPages; }
  isUnlocked(id: string): boolean { return this.unlockedIds().includes(id); }

  relicPagesRemaining(): number {
    return STORY_PAGES.filter((p) => p.unlock.type === 'relic' && !this.isUnlocked(p.id)).length;
  }

  stage(): StoryStage {
    const u = new Set(this.unlockedIds());
    if (STORY_PAGES.every((p) => u.has(p.id))) return 'complete';
    if (u.has('freed')) return 'freed';
    if (u.has('titan')) return 'titanSeen';
    const progressed = STORY_PAGES.some(
      (p) => u.has(p.id) && (p.unlock.type === 'relic' || p.unlock.type === 'height'));
    return progressed ? 'climbing' : 'newKeeper';
  }

  onVignetteSeen(): StoryPage[] {
    this.save.update((b) => { b.story.vignetteSeen = true; });
    return this.unlock(STORY_PAGES.filter((p) => p.unlock.type === 'start'));
  }

  onHeight(height: number): StoryPage[] {
    return this.unlock(STORY_PAGES.filter(
      (p) => p.unlock.type === 'height' && height >= (p.unlock.value ?? Infinity)));
  }

  /** Relic pages unlock in STORY_PAGES order regardless of where the relic was found. */
  onRelic(): StoryPage[] {
    const next = STORY_PAGES.find((p) => p.unlock.type === 'relic' && !this.isUnlocked(p.id));
    return next ? this.unlock([next]) : [];
  }

  onTitanReach(): StoryPage[] {
    return this.unlock(STORY_PAGES.filter((p) => p.unlock.type === 'titanReach'));
  }

  /** Surviving the Titan's assault (bossPhase 'end') = freeing the fallen keeper. */
  onTitanDefeat(): StoryPage[] {
    this.save.update((b) => { b.story.titanDefeats += 1; });
    const pages = this.unlock(STORY_PAGES.filter((p) => p.unlock.type === 'titanDefeat'));
    if (pages.some((p) => p.id === COLE_PAGE_ID)) {
      this.save.update((b) => {
        if (!b.ownedCharacters.includes('cole')) b.ownedCharacters.push('cole');
      });
    }
    return pages;
  }

  /** Unlock the not-yet-unlocked subset, persist, then cascade the finale page. */
  private unlock(pages: StoryPage[]): StoryPage[] {
    const fresh = pages.filter((p) => !this.isUnlocked(p.id));
    if (fresh.length === 0) return [];
    this.save.update((b) => {
      for (const p of fresh) {
        if (!b.story.unlockedPages.includes(p.id)) b.story.unlockedPages.push(p.id);
      }
    });
    const finale = STORY_PAGES.find((p) => p.unlock.type === 'allPages');
    if (finale && !this.isUnlocked(finale.id)) {
      const rest = STORY_PAGES.filter((p) => p.unlock.type !== 'allPages');
      if (rest.every((p) => this.isUnlocked(p.id))) {
        this.save.update((b) => { b.story.unlockedPages.push(finale.id); });
        return [...fresh, finale];
      }
    }
    return fresh;
  }
}
