/**
 * Puture's scroll pacing for the Work and Process chapters, in screens (1 = 100svh of scrolling).
 *
 * A chapter is a pinned section (total + 1) screens tall. Each beat has a mark (where the camera arrives;
 * it starts moving 2.2 screens earlier) and an [in, out) range in which its HTML copy is shown.
 * Work (Puture's `Y([5.2, …4, .4], { pause: [2.4, …1, 2.4] })`): lead .15 · award 5.2 · pause 2.4 · per project 4
 * (+1 between) · pause 2.4 · fold .4 · tail .35.
 * Process: Puture pins three scenes (title 4.8 · steps 4/4/4 · statement 4.2) with an 80vh margin after each, which
 * leaves ~2.3 screens with no copy at the two joins while the camera moves; ours is one pin with those joins built in.
 */
export type Beat = { at: number; in: number; out: number };

export type WorkPacing = {
  total: number;
  /** the opening beat (Puture's `.work-award`): label, headline and the glass box, before the camera flies to project 1 */
  award: Beat;
  cards: Beat[];
  /** the pull-back over the whole floor; the tail link shows in its range */
  fold: Beat;
  /** mark where the scene has fully become the next chapter's opening frame (dark hand-off), or the fold's hold */
  end: number;
};

/**
 * The chapter numbers the HUD shows (Puture's: 02 Work, 03 Process — ChapterBadge's HUD_CHAPTERS), repeated here so the
 * chapter labels and the case pager (a server component) can use them.
 */
export const CHAPTER_INDEX = { work: "02", process: "03" } as const;

/**
 * Puture's Work pacing, on the home page and on /work alike (`compact` is kept for callers; it no longer shortens the
 * holds). `handoff`: after the fold the sky and grid ramp to the dark Process opening over 1.5 screens, so the next
 * chapter's canvas slides in over an identical frame (Puture cross-fades inside its single canvas).
 */
export function workPacing(count: number, tail: boolean, compact = false, handoff = false): WorkPacing {
  void compact;
  const lead = 0.15;
  const awardHold = 5.2;
  const awardPause = 2.4;
  const hold = 4;
  const pause = 1;
  const foldPause = 2.4;
  const fold = 0.4;
  const handoffLen = 1.5;
  const end = 0.35;
  const award: Beat = { at: 0, in: lead, out: lead + awardHold };
  let a = award.out + awardPause;
  const cards: Beat[] = [];
  for (let i = 0; i < count; i++) {
    cards.push({ at: a, in: a, out: a + hold });
    a += hold + (i < count - 1 ? pause : foldPause);
  }
  const foldAt = a;
  const endAt = foldAt + (handoff ? handoffLen : fold);
  a = endAt + end;
  // with a dark hand-off the tail link leaves before the backdrop turns dark
  return { total: a, award, cards, fold: { at: foldAt, in: tail ? foldAt - 1.2 : a, out: handoff ? foldAt + 0.6 : a }, end: endAt };
}

export type ProcessPacing = {
  total: number;
  title: Beat;
  steps: Beat[];
  statement: Beat;
  /** mark where the sky has gone to night under the statement, so the next (dark) section clips over a dark frame */
  end: number;
};

/** Screens added at both joins (title → step 1, last step → statement): .5 + 1.8 ≈ Puture's 2.3 copy-free screens. */
const JOIN = 1.8;

export function processPacing(count: number, compact = false): ProcessPacing {
  const lead = 0.15;
  const end = 0.35;
  const titleHold = compact ? 2.6 : 4.8;
  const hold = compact ? 2.4 : 4;
  // Puture's statement beat: the zoom runs over 5–55 % of it, then holds ~1.9 screens
  const stmt = 4.2;
  const title: Beat = { at: 0, in: lead, out: lead + titleHold };
  let a = title.out + end + lead + JOIN;
  const steps: Beat[] = [];
  for (let i = 0; i < count; i++) {
    steps.push({ at: a, in: a, out: a + hold });
    a += hold + (i < count - 1 ? 1 : 0);
  }
  a += end + lead + JOIN;
  const statement: Beat = { at: a, in: a, out: a + stmt };
  a += stmt + end;
  return { total: a, title, steps, statement, end: statement.out };
}
