/**
 * Snake-draft position math: given a league's team count and your draft
 * slot, when does your turn come around again? This is what turns "ADP" from
 * a vague vibe into an actual answer to "will he be there when I pick next" —
 * everything else (the scarcity drop-off score, the survival estimate) is
 * built on top of the pick numbers this computes.
 */

export type NextTurnEstimate = {
  /** Your very next scheduled pick, at or after the pick about to happen. */
  currentOrNextPickNo: number;
  /** The pick after that — the "next round" this tool means by "next pick." */
  followingPickNo: number;
  /** How many other teams' picks happen between those two — the real, snake-order-aware pick window. */
  picksUntilFollowingTurn: number;
};

/**
 * `nextPickNo` is the very next pick about to be made overall (1-indexed).
 * Returns null for invalid inputs (bad team count/slot) or if the draft is
 * outside `maxRounds` of remaining picks (a generous 30-round ceiling —
 * no real redraft league runs that deep).
 */
export function estimateNextTurn(teams: number, myDraftSlot: number, nextPickNo: number, maxRounds = 30): NextTurnEstimate | null {
  if (!Number.isFinite(teams) || teams <= 0) return null;
  if (!Number.isFinite(myDraftSlot) || myDraftSlot < 1 || myDraftSlot > teams) return null;
  if (!Number.isFinite(nextPickNo) || nextPickNo < 1) return null;

  const myPickNumbers: number[] = [];
  for (let round = 1; round <= maxRounds; round++) {
    // Odd rounds draft slot order 1..teams; even rounds reverse (the "snake").
    const posInRound = round % 2 === 1 ? myDraftSlot : teams - myDraftSlot + 1;
    myPickNumbers.push((round - 1) * teams + posInRound);
  }

  const idx = myPickNumbers.findIndex((p) => p >= nextPickNo);
  if (idx === -1 || idx + 1 >= myPickNumbers.length) return null;

  const currentOrNextPickNo = myPickNumbers[idx];
  const followingPickNo = myPickNumbers[idx + 1];
  return {
    currentOrNextPickNo,
    followingPickNo,
    picksUntilFollowingTurn: followingPickNo - currentOrNextPickNo - 1,
  };
}

export type SurvivalTier = "likely-gone" | "toss-up" | "likely-there";

export const SURVIVAL_LABEL: Record<SurvivalTier, string> = {
  "likely-gone": "Likely gone",
  "toss-up": "Could go either way",
  "likely-there": "Likely still there",
};

/**
 * Where a player ranks among the currently-undrafted pool by market signal
 * (1 = most likely to be drafted next) determines whether he survives a
 * window of `picksUntilNextTurn` other teams' picks. This is a plain
 * ADP-order simulation, not a real probability model — deliberately
 * transparent (the tool's whole ethos) rather than false precision. A 1.5x
 * buffer on the "toss-up" band acknowledges real drafts don't follow ADP
 * exactly.
 */
export function survivalTier(rankAmongUndrafted: number, picksUntilNextTurn: number): SurvivalTier {
  if (rankAmongUndrafted <= picksUntilNextTurn) return "likely-gone";
  if (rankAmongUndrafted <= picksUntilNextTurn * 1.5) return "toss-up";
  return "likely-there";
}
