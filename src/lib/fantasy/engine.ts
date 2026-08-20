/**
 * War room orchestrator — the single function the UI calls after any input
 * changes (new sync, edited scoring settings, new CSV import, edited roster
 * slots). Pure and synchronous: same inputs always produce the same board,
 * which is what makes the whole tool feel "live" as settings are tweaked.
 */

import { computeInjuryRisk } from "./injury-risk";
import { computeScarcity } from "./scarcity";
import { valuePlayers } from "./scoring";
import { computeSos } from "./sos";
import type { DefenseRating, LeagueSettings, Player, ScarcityResult, ScheduleEntry, WarRoomRow } from "./types";

export type CompositeWeights = {
  /** How much a player's injury-risk score discounts his value (0-1). */
  injuryWeight: number;
  /** How much playoff-week SoS shifts value, as a fraction of a replacement-level swing. */
  sosWeight: number;
};

export const DEFAULT_WEIGHTS: CompositeWeights = {
  injuryWeight: 0.18,
  sosWeight: 0.08,
};

export function buildWarRoomBoard(
  players: Player[],
  league: LeagueSettings,
  schedule: ScheduleEntry[],
  defense: DefenseRating[],
  gamesMissedById: Record<string, number>,
  weights: CompositeWeights = DEFAULT_WEIGHTS
): { rows: WarRoomRow[]; scarcity: ScarcityResult } {
  const valued = valuePlayers(players, league.scoring);
  const scarcity = computeScarcity(valued, league);

  const rows: WarRoomRow[] = scarcity.players.map((p) => {
    const injury = computeInjuryRisk(p, gamesMissedById[p.id]);
    const sos = computeSos(p, schedule, defense, league.playoffWeeks);

    const injuryDiscount = 1 - weights.injuryWeight * (injury.score / 100);
    const sosGrade = sos.playoffGrade ?? sos.fullSeasonGrade;
    const sosAdjustment = sosGrade != null ? ((sosGrade - 50) / 50) * weights.sosWeight * Math.max(p.vbd, 0) : 0;

    const compositeValue = Math.round((p.vbd * injuryDiscount + sosAdjustment) * 10) / 10;

    return { ...p, injury, sos, compositeValue, vorpRank: null, marketRank: null, valueDelta: null };
  });

  // Overall VORP rank (1 = best value-over-replacement in the whole pool,
  // across positions) — this is "true value order" as this tool sees it.
  [...rows]
    .sort((a, b) => b.vbd - a.vbd)
    .forEach((p, idx) => {
      p.vorpRank = idx + 1;
    });

  // Market rank: real ADP if synced/imported, else Sleeper's search_rank as
  // a proxy (Sleeper doesn't expose a true consensus-ADP endpoint). Ranked
  // only among players who actually carry one of those signals, so a
  // missing signal never masquerades as "rank 1".
  [...rows]
    .filter((p) => p.adp != null || p.searchRank != null)
    .sort((a, b) => (a.adp ?? a.searchRank!) - (b.adp ?? b.searchRank!))
    .forEach((p, idx) => {
      p.marketRank = idx + 1;
    });

  // Value vs. ADP: positive means the market drafts him later than his
  // value rank (a "wait" candidate — Derrick Henry-type value that falls),
  // negative means the market drafts him earlier than his value rank (he
  // won't last to his "true" spot if you're waiting on him).
  for (const p of rows) {
    p.valueDelta = p.marketRank != null && p.vorpRank != null ? p.marketRank - p.vorpRank : null;
  }

  rows.sort((a, b) => b.compositeValue - a.compositeValue);
  return { rows, scarcity };
}
