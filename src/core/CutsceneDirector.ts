import { cutsceneForPage } from './cutscenes';
import type { StoryPage } from './story';
import type { SaveData } from './SaveData';

/** Pure queue engine over SaveData, mirroring StoryProgress's shape. Cutscenes
 *  linked to newly-unlocked story pages are enqueued (deduped against both
 *  pending and watched — a scene auto-plays once); the Journal's manual replay
 *  never touches this queue. */
export class CutsceneDirector {
  constructor(readonly save: SaveData) {}

  pending(): string[] { return this.save.get().story.pendingCutscenes; }
  isWatched(id: string): boolean { return this.save.get().story.watchedCutscenes.includes(id); }

  enqueueFor(pages: StoryPage[]): void {
    const ids = pages
      .map((p) => cutsceneForPage(p.id)?.id)
      .filter((id): id is string => id !== undefined);
    if (ids.length === 0) return;
    this.save.update((b) => {
      for (const id of ids) {
        if (!b.story.pendingCutscenes.includes(id) && !b.story.watchedCutscenes.includes(id)) {
          b.story.pendingCutscenes.push(id);
        }
      }
    });
  }

  markWatched(id: string): void {
    this.save.update((b) => {
      b.story.pendingCutscenes = b.story.pendingCutscenes.filter((x) => x !== id);
      if (!b.story.watchedCutscenes.includes(id)) b.story.watchedCutscenes.push(id);
    });
  }
}
