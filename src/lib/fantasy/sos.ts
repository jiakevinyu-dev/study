/**
 * Strength-of-schedule engine.
 *
 * Deliberately ships with NO baked-in schedule or defense data. This tool
 * was built in a sandboxed environment with no outbound network access, so
 * there was no way to fetch and verify a real, current NFL schedule or
 * defense-vs-position ranking — and hardcoding one as if it were live fact
 * would be worse than not having the feature. Instead this computes SoS
 * from whatever ScheduleEntry[] / DefenseRating[] the user has synced or
 * imported (see data-import panel), and degrades cleanly to "no data" when
 * they haven't.
 */

import type { DefenseRating, Player, ScheduleEntry, SosResult } from "./types";

export function computeSos(
  player: Player,
  schedule: ScheduleEntry[],
  defense: DefenseRating[],
  playoffWeeks: number[]
): SosResult {
  if (!player.team || schedule.length === 0 || defense.length === 0) {
    return { fullSeasonGrade: null, playoffGrade: null, gamesFound: 0, playoffGamesFound: 0 };
  }

  const games = schedule.filter((g) => g.team === player.team && g.opponent !== "BYE");
  if (games.length === 0) {
    return { fullSeasonGrade: null, playoffGrade: null, gamesFound: 0, playoffGamesFound: 0 };
  }

  const defenseByTeam = new Map<string, number>();
  for (const d of defense) {
    if (d.position === player.position) defenseByTeam.set(d.team, d.rankVsPosition);
  }

  const rankFor = (opponent: string) => defenseByTeam.get(opponent);

  const allRanks = games.map((g) => rankFor(g.opponent)).filter((r): r is number => r != null);
  const playoffRanks = games
    .filter((g) => playoffWeeks.includes(g.week))
    .map((g) => rankFor(g.opponent))
    .filter((r): r is number => r != null);

  // Defense rank 1 = toughest, 32 = easiest. Grade 0-100, higher = easier
  // schedule, by rescaling the average opponent rank.
  const gradeFromRanks = (ranks: number[]) => (ranks.length === 0 ? null : Math.round((avg(ranks) / 32) * 1000) / 10);

  return {
    fullSeasonGrade: gradeFromRanks(allRanks),
    playoffGrade: gradeFromRanks(playoffRanks),
    gamesFound: allRanks.length,
    playoffGamesFound: playoffRanks.length,
  };
}

function avg(nums: number[]): number {
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}
