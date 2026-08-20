/**
 * Injury-risk heuristic.
 *
 * A transparent, documented scoring model — not a medical or actuarial
 * prediction. Every factor that contributes to a player's score is returned
 * alongside it so the UI can show its work instead of a black-box number.
 *
 * Inputs come from whatever's on file for the player: Sleeper's live
 * injury designation (current, real signal once synced) plus age/position
 * base rates (well-established fantasy-analysis heuristics) and, if the
 * user imported it, recent games-missed history.
 */

import type { InjuryRisk, InjuryStatus, Player, Position } from "./types";

const STATUS_POINTS: Record<InjuryStatus, number> = {
  Healthy: 0,
  Questionable: 12,
  Doubtful: 25,
  Out: 32,
  IR: 42,
  PUP: 38,
  Suspended: 0, // availability risk, not injury risk
};

/** Age past which decline/injury risk starts climbing, by position. */
const AGE_THRESHOLD: Record<Position, number> = { QB: 33, RB: 26, WR: 29, TE: 30 };
/** Points added per year past the threshold. */
const AGE_SLOPE: Record<Position, number> = { QB: 2.5, RB: 4.5, WR: 3, TE: 3 };
/** Position base rate — workload/contact exposure independent of age. */
const POSITION_BASE: Record<Position, number> = { QB: 4, RB: 14, WR: 6, TE: 8 };

export function computeInjuryRisk(player: Player, gamesMissedLastSeason?: number): InjuryRisk {
  const factors: string[] = [];
  let score = 0;

  const statusPts = STATUS_POINTS[player.injuryStatus];
  if (statusPts > 0) {
    score += statusPts;
    factors.push(
      `Current designation: ${player.injuryStatus}${player.injuryBodyPart ? ` (${player.injuryBodyPart})` : ""} (+${statusPts})`
    );
  }

  const base = POSITION_BASE[player.position];
  score += base;
  factors.push(`${player.position} base workload/contact rate (+${base})`);

  if (player.age != null) {
    const threshold = AGE_THRESHOLD[player.position];
    if (player.age > threshold) {
      const agePts = Math.min((player.age - threshold) * AGE_SLOPE[player.position], 30);
      score += agePts;
      factors.push(`Age ${player.age}, past typical ${player.position} decline curve (+${Math.round(agePts)})`);
    }
  } else {
    factors.push("Age unknown — base rate only");
  }

  if (gamesMissedLastSeason != null && gamesMissedLastSeason > 0) {
    const histPts = Math.min(gamesMissedLastSeason * 3, 25);
    score += histPts;
    factors.push(`Missed ${gamesMissedLastSeason} games last season (+${Math.round(histPts)})`);
  }

  score = Math.max(0, Math.min(100, Math.round(score)));

  const tier: InjuryRisk["tier"] = score >= 75 ? "High" : score >= 50 ? "Elevated" : score >= 25 ? "Moderate" : "Low";

  return { score, tier, factors };
}
