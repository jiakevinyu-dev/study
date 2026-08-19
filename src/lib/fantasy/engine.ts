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

    return { ...p, injury, sos, compositeValue };
  });

  rows.sort((a, b) => b.compositeValue - a.compositeValue);
  return { rows, scarcity };
}
