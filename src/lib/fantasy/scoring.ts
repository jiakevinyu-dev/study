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
 * Position-specific decay curves for estimating fantasy points from a rank
 * (ADP, or Sleeper's search_rank as a proxy) when no real projection exists.
 * `ceiling` approximates the position's #1 overall points; `decay` controls
 * how quickly value falls off with rank. These are hand-tuned to produce a
 * realistic *shape* (steep early, flattening out) — an approximation for
 * sorting/tiering, not a projection to be taken as fact.
 */
const RANK_CURVE: Record<Position, { ceiling: number; floor: number; decay: number }> = {
  QB: { ceiling: 380, floor: 120, decay: 0.045 },
  RB: { ceiling: 340, floor: 40, decay: 0.055 },
  WR: { ceiling: 320, floor: 40, decay: 0.045 },
  TE: { ceiling: 230, floor: 30, decay: 0.07 },
};

export function estimatePointsFromRank(positionRank: number, position: Position): number {
  const { ceiling, floor, decay } = RANK_CURVE[position];
  const value = floor + (ceiling - floor) * Math.exp(-decay * (positionRank - 1));
  return Math.round(value * 10) / 10;
}

/**
 * Computes points for every player, ranks them within position, and returns
 * ValuedPlayer[] sorted by points descending overall.
 */
export function valuePlayers(players: Player[], scoring: ScoringSettings): ValuedPlayer[] {
  // First pass: players with a real projection get exact points immediately.
  // Players without one need a rank *within their position among rank-known
  // peers* before we can estimate — so bucket, sort by whatever rank signal
  // we have (adp, then searchRank), and use that ordinal as positionRank.
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

    const rankSorted = [...withoutProjection].sort((a, b) => {
      const ra = a.adp ?? a.searchRank ?? Number.POSITIVE_INFINITY;
      const rb = b.adp ?? b.searchRank ?? Number.POSITIVE_INFINITY;
      return ra - rb;
    });
    rankSorted.forEach((p, idx) => {
      valued.push({
        ...p,
        points: estimatePointsFromRank(idx + 1, position),
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
