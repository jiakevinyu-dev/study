/**
 * The ranked "who to draft next" list — the tool's actual recommendation
 * engine, separate from the board's default VBD sort.
 *
 * Combines two distinct signals, both computed transparently and shown
 * separately (never a black box):
 *
 *  - Marginal team value: run the same starting-lineup slot-filling
 *    simulation team-strength.ts uses on (my roster + candidate) and see how
 *    much it actually raises my starting VBD. This is what makes a great QB
 *    worth ~0 once QB and SUPERFLEX are both already started, and lets an
 *    ordinary player filling a genuinely empty slot outrank him.
 *  - Scarcity drop-off by your next turn: using the league's real snake-draft
 *    order (draft-context.ts) and the current market-rank order of the
 *    undrafted pool, estimate how many players at this position will likely
 *    still be around when your turn comes back — and by how many points the
 *    best of them falls short of the player available right now. A player
 *    whose position craters before your next pick scores higher than one the
 *    market will still be offering just as good a version of later, even at
 *    equal marginal value today.
 *
 * `scarcityWeight` (tunable, matches the "make it a tunable parameter"
 * request) controls how much the second signal moves the combined score;
 * both raw components are returned so the UI can show its work.
 */

import { estimateNextTurn, survivalTier, type NextTurnEstimate, type SurvivalTier } from "./draft-context";
import { computeTeamStrength } from "./team-strength";
import { DEFAULT_LEAGUE, type LeagueSettings, type Position, type WarRoomRow } from "./types";

export type DraftPositionContext = {
  teams: number;
  myDraftSlot: number;
  /** The next pick about to happen in the synced draft (1-indexed). */
  nextPickNo: number;
};

export type Recommendation = {
  player: WarRoomRow;
  /** How much this pick raises your projected starting VBD right now. */
  marginal: number;
  /** Points this player has over the best same-position player likely to survive to your next turn. Null if draft position context isn't known. */
  scarcityDropoff: number | null;
  survival: SurvivalTier | null;
  /** How many other teams pick before your next turn — the window the drop-off/survival estimate is computed over. */
  picksUntilNextTurn: number | null;
  /** marginal + scarcityWeight * (scarcityDropoff ?? 0) — the combined, sortable score. */
  score: number;
};

export const DEFAULT_SCARCITY_WEIGHT = 0.5;

export function getRecommendations(
  pool: WarRoomRow[],
  myRoster: WarRoomRow[],
  league: LeagueSettings,
  opts: {
    limit?: number;
    scarcityWeight?: number;
    draftPosition?: DraftPositionContext | null;
  } = {}
): Recommendation[] {
  const limit = opts.limit ?? 5;
  const scarcityWeight = opts.scarcityWeight ?? DEFAULT_SCARCITY_WEIGHT;
  const baseStartingVbd = computeTeamStrength(myRoster, league).startingVbd;

  // Hard positional caps (e.g. "never more than 2 TEs") are excluded before
  // any value math runs at all — not a scoring penalty, an actual "we'd
  // never draft this" line. Marginal value and scarcity drop-off both only
  // know "this player has some value somewhere"; neither knows a redraft
  // roster simply won't carry a 3rd TE regardless of how his numbers look
  // in an empty FLEX slot today.
  const rosterCountByPosition = new Map<Position, number>();
  for (const p of myRoster) rosterCountByPosition.set(p.position, (rosterCountByPosition.get(p.position) ?? 0) + 1);
  const cappedOut = new Set<Position>();
  const positionCaps = league.positionCaps ?? DEFAULT_LEAGUE.positionCaps;
  for (const [pos, cap] of Object.entries(positionCaps) as [Position, number | undefined][]) {
    if (cap != null && (rosterCountByPosition.get(pos) ?? 0) >= cap) cappedOut.add(pos);
  }
  const eligiblePool = cappedOut.size > 0 ? pool.filter((p) => !cappedOut.has(p.position)) : pool;

  // Snake-order pick window to my next turn, and — inside that — the
  // market-rank order of the whole undrafted pool, which is what tells us
  // "the Nth-most-likely-to-go player is the survival cutoff."
  let nextTurn: NextTurnEstimate | null = null;
  const marketSorted: WarRoomRow[] = [];
  if (opts.draftPosition) {
    nextTurn = estimateNextTurn(opts.draftPosition.teams, opts.draftPosition.myDraftSlot, opts.draftPosition.nextPickNo);
    if (nextTurn) {
      marketSorted.push(
        ...[...pool]
          .filter((p) => p.marketRank != null)
          .sort((a, b) => (a.marketRank ?? Infinity) - (b.marketRank ?? Infinity))
      );
    }
  }
  const rankAmongUndrafted = new Map<string, number>();
  marketSorted.forEach((p, idx) => rankAmongUndrafted.set(p.id, idx + 1));

  // Best remaining player at each position expected to survive the window —
  // the baseline the drop-off is measured against. Falls back to whatever's
  // simply the lowest-points survivor if the whole pool at that position is
  // expected to be gone (a real, if rare, "position is about to vanish"
  // case — the drop-off should still read as large, not undefined).
  const bestSurvivorByPosition = new Map<Position, WarRoomRow>();
  if (nextTurn) {
    for (const p of marketSorted) {
      const rank = rankAmongUndrafted.get(p.id)!;
      if (rank <= nextTurn.picksUntilFollowingTurn) continue; // expected to be gone before my turn
      const current = bestSurvivorByPosition.get(p.position);
      if (!current || p.points > current.points) bestSurvivorByPosition.set(p.position, p);
    }
  }

  const scored: Recommendation[] = eligiblePool.map((player) => {
    const marginal = Math.round((computeTeamStrength([...myRoster, player], league).startingVbd - baseStartingVbd) * 10) / 10;

    let scarcityDropoff: number | null = null;
    let survival: SurvivalTier | null = null;
    if (nextTurn) {
      const rank = rankAmongUndrafted.get(player.id);
      if (rank != null) survival = survivalTier(rank, nextTurn.picksUntilFollowingTurn);
      const survivor = bestSurvivorByPosition.get(player.position);
      // If nobody at this position is expected to survive, fall back to
      // replacement level as the worst-case baseline the position falls to.
      const baseline = survivor ? survivor.points : player.points - player.vbd;
      scarcityDropoff = Math.round((player.points - baseline) * 10) / 10;
    }

    const score = Math.round((marginal + scarcityWeight * (scarcityDropoff ?? 0)) * 10) / 10;

    return {
      player,
      marginal,
      scarcityDropoff,
      survival,
      picksUntilNextTurn: nextTurn?.picksUntilFollowingTurn ?? null,
      score,
    };
  });

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    // Tie-break, same reasoning as before: thinner tier first (higher
    // urgency), then raw VBD, so results stay sensible once scores flatten
    // out (e.g. once starters are full and marginal/dropoff both hit 0).
    if (a.player.tier !== b.player.tier) return a.player.tier - b.player.tier;
    if (a.player.tierSize !== b.player.tierSize) return a.player.tierSize - b.player.tierSize;
    return b.player.vbd - a.player.vbd;
  });

  return scored.slice(0, limit);
}
