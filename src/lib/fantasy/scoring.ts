/**
 * Turns a Player into a ValuedPlayer by computing season fantasy points under
 * the league's *current* ScoringSettings.
 *
 * Two paths:
 *  1. Real stat-line projection imported (preferred) → exact dot product with
 *     scoring settings. Flip PPR, TE premium, or any stat weight and every
 *     player's points update instantly.
 *  2. No projection on file → fall back to an ADP/search-rank decay curve
 *     that approximates value shape by position. Clearly flagged as an
 *     estimate everywhere it's shown.
 */

import type { Player, Position, ScoringSettings, StatProjection, ValuedPlayer } from "./types";

export function pointsFromStatLine(stats: StatProjection, position: Position, scoring: ScoringSettings): number {
  const recBonus = position === "TE" ? scoring.teRecBonus : 0;
  return (
    (stats.passYd ?? 0) * scoring.passYd +
    (stats.passTd ?? 0) * scoring.passTd +
    (stats.passInt ?? 0) * scoring.passInt +
    (stats.pass2pt ?? 0) * scoring.pass2pt +
    (stats.rushYd ?? 0) * scoring.rushYd +
    (stats.rushTd ?? 0) * scoring.rushTd +
    (stats.rush2pt ?? 0) * scoring.rush2pt +
    (stats.rec ?? 0) * (scoring.rec + recBonus) +
    (stats.recYd ?? 0) * scoring.recYd +
    (stats.recTd ?? 0) * scoring.recTd +
    (stats.rec2pt ?? 0) * scoring.rec2pt +
    (stats.fumbleLost ?? 0) * scoring.fumbleLost
  );
}

/**
 * Position-specific decay curves for estimating fantasy points from a real
 * rank gap (ADP, or Sleeper's search_rank as a proxy) when no real
 * projection exists. `ceiling` approximates the position's #1 overall
 * points; `decay` controls how quickly value falls off with rank. These are
 * hand-tuned to produce a realistic *shape* (steep early, flattening out) —
 * an approximation for sorting/tiering, not a projection to be taken as
 * fact.
 *
 * The decay input is the real numeric rank GAP from that position's own #1
 * player (e.g. TE1 at overall rank 34 → gap 0; the 5th-ranked TE at overall
 * rank 90 → gap 56), not an ordinal "1st, 2nd, 3rd..." position-rank count.
 * That distinction is the whole fix for a real reported bug: two same-
 * position players a *few ordinal spots* apart in a shallow position (TE
 * has maybe 10 truly relevant options) can be tens of real draft picks
 * apart, while the same ordinal gap in a deep position (RB/WR have 30+) is
 * only a handful of picks. Decaying by ordinal position-rank exaggerated
 * shallow-position gaps into cliffs the real market doesn't see — e.g. a
 * TE ranked 5th at his position (but only 56 real picks behind the TE1)
 * scored ~40 points higher than a TE ranked 9th just 21 picks further
 * back, a far steeper penalty than the ~2-round real ADP gap between them
 * justified, and enough to make him out-rank clearly better, more
 * established options a market consensus has him only modestly ahead of.
 * Decaying by the real pick gap instead keeps that comparison honest.
 */
const RANK_CURVE: Record<Position, { ceiling: number; floor: number; decay: number }> = {
  QB: { ceiling: 380, floor: 120, decay: 0.02 },
  RB: { ceiling: 340, floor: 40, decay: 0.02 },
  WR: { ceiling: 320, floor: 40, decay: 0.02 },
  TE: { ceiling: 230, floor: 30, decay: 0.02 },
};

export function estimatePointsFromRank(gapFromPositionTop: number, position: Position): number {
  const { ceiling, floor, decay } = RANK_CURVE[position];
  const value = floor + (ceiling - floor) * Math.exp(-decay * gapFromPositionTop);
  return Math.round(value * 10) / 10;
}

/**
 * Computes points for every player, ranks them within position, and returns
 * ValuedPlayer[] sorted by points descending overall.
 */
export function valuePlayers(players: Player[], scoring: ScoringSettings): ValuedPlayer[] {
  // First pass: players with a real projection get exact points immediately.
  // Players without one get estimated from the real numeric rank gap behind
  // their position's own #1 player (see estimatePointsFromRank) — so bucket
  // by position, sort by whatever rank signal we have (adp, then
  // searchRank), and read that gap off the sorted list's own values, not
  // its ordinal index.
  const byPosition = new Map<Position, Player[]>();
  for (const p of players) {
    const bucket = byPosition.get(p.position) ?? [];
    bucket.push(p);
    byPosition.set(p.position, bucket);
  }

  const valued: ValuedPlayer[] = [];

  for (const [position, group] of byPosition) {
    const withProjection = group.filter((p) => p.projStats);
    const withoutProjection = group.filter((p) => !p.projStats);

    for (const p of withProjection) {
      valued.push({
        ...p,
        points: Math.round(pointsFromStatLine(p.projStats!, position, scoring) * 10) / 10,
        pointsBasis: "projection",
        positionRank: 0, // assigned below
      });
    }

    const rankOf = (p: Player) => p.adp ?? p.searchRank ?? Number.POSITIVE_INFINITY;
    // topRank has to come from the WHOLE position group, not just the
    // players being estimated here. If it were taken from withoutProjection
    // alone, a position whose true #1 happens to have a real stat line
    // (increasingly common now that real-2025-stats.ts covers the top of
    // most positions) would let whoever's #1 *among the leftover estimate
    // group* start at gap 0 — handing some QB2/RB2-tier guy the position's
    // full ceiling, exactly the ordinal-vs-real-rank distortion the last
    // fix already eliminated for the ranking itself, just reintroduced here
    // by only looking at a subset of the position.
    const groupRankSorted = [...group].sort((a, b) => rankOf(a) - rankOf(b));
    // Falls back to 0 only in the degenerate case where nobody at this
    // position has any rank signal at all — otherwise the sort guarantees
    // groupRankSorted[0] is the position's real top (finite) rank.
    const firstRank = groupRankSorted.length > 0 ? rankOf(groupRankSorted[0]) : 0;
    const topRank = Number.isFinite(firstRank) ? firstRank : 0;

    const rankSorted = [...withoutProjection].sort((a, b) => rankOf(a) - rankOf(b));
    rankSorted.forEach((p) => {
      valued.push({
        ...p,
        points: estimatePointsFromRank(rankOf(p) - topRank, position),
        pointsBasis: "adp-estimate",
        positionRank: 0,
      });
    });
  }

  // Assign final positionRank now that every player in a position has points.
  const finalByPosition = new Map<Position, ValuedPlayer[]>();
  for (const p of valued) {
    const bucket = finalByPosition.get(p.position) ?? [];
    bucket.push(p);
    finalByPosition.set(p.position, bucket);
  }
  for (const bucket of finalByPosition.values()) {
    bucket.sort((a, b) => b.points - a.points);
    bucket.forEach((p, idx) => {
      p.positionRank = idx + 1;
    });
  }

  return valued.sort((a, b) => b.points - a.points);
}
