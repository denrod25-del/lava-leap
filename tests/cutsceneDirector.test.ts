import { describe, it, expect } from 'vitest';
import { SaveData } from '../src/core/SaveData';
import { CutsceneDirector } from '../src/core/CutsceneDirector';
import { STORY_PAGES } from '../src/core/story';
import type { KeyValueStore } from '../src/core/ScoreTracker';

function fakeStore(): KeyValueStore {
  const m = new Map<string, string>();
  return { getItem: (k) => m.get(k) ?? null, setItem: (k, v) => void m.set(k, v) };
}
const fresh = () => new CutsceneDirector(new SaveData(fakeStore()));
const page = (id: string) => STORY_PAGES.find((p) => p.id === id)!;

describe('CutsceneDirector.enqueueFor', () => {
  it('enqueues the cutscene linked to a page', () => {
    const cd = fresh();
    cd.enqueueFor([page('titan')]);
    expect(cd.pending()).toEqual(['keeper-rises']);
  });
  it('ignores pages with no linked cutscene', () => {
    const cd = fresh();
    cd.enqueueFor([page('first-climb'), page('vault-1')]);
    expect(cd.pending()).toEqual([]);
  });
  it('does not duplicate an already-pending cutscene', () => {
    const cd = fresh();
    cd.enqueueFor([page('titan')]);
    cd.enqueueFor([page('titan')]);
    expect(cd.pending()).toEqual(['keeper-rises']);
  });
  it('never re-enqueues a watched cutscene', () => {
    const cd = fresh();
    cd.enqueueFor([page('titan')]);
    cd.markWatched('keeper-rises');
    cd.enqueueFor([page('titan')]);
    expect(cd.pending()).toEqual([]);
  });
  it('enqueues multiple linked cutscenes from one batch, in page order', () => {
    const cd = fresh();
    cd.enqueueFor([page('freed'), page('summit')]);
    expect(cd.pending()).toEqual(['freed', 'summit']);
  });
});

describe('CutsceneDirector.markWatched / isWatched', () => {
  it('moves an id from pending to watched, idempotently', () => {
    const cd = fresh();
    cd.enqueueFor([page('titan')]);
    cd.markWatched('keeper-rises');
    expect(cd.pending()).toEqual([]);
    expect(cd.isWatched('keeper-rises')).toBe(true);
    cd.markWatched('keeper-rises'); // second call: no duplicate, no crash
    expect(cd.save.get().story.watchedCutscenes).toEqual(['keeper-rises']);
  });
  it('marking watched something never enqueued is a safe no-op besides recording it', () => {
    const cd = fresh();
    cd.markWatched('opening');
    expect(cd.isWatched('opening')).toBe(true);
    expect(cd.pending()).toEqual([]);
  });
});
