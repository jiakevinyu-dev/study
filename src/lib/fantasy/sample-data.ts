/**
 * Fictitious example dataset — clearly-labeled placeholder players used only
 * to demo the engine's mechanics (scarcity, tiers, injury heuristic) before
 * a real Sleeper sync or CSV import. None of this represents a real person,
 * team, or projection.
 */

import { normalizeName, type ImportedPlayerRow } from "./imports";

function row(
  name: string,
  position: ImportedPlayerRow["position"],
  team: string,
  projStats: ImportedPlayerRow["projStats"]
): ImportedPlayerRow {
  return { key: normalizeName(name), name, position, team, projStats };
}

export const EXAMPLE_PLAYERS: ImportedPlayerRow[] = [
  row("Example QB1", "QB", "EX1", { passYd: 4600, passTd: 34, passInt: 9, rushYd: 380, rushTd: 4 }),
  row("Example QB2", "QB", "EX2", { passYd: 4300, passTd: 30, passInt: 10, rushYd: 550, rushTd: 6 }),
  row("Example QB3", "QB", "EX3", { passYd: 4100, passTd: 27, passInt: 11, rushYd: 120, rushTd: 2 }),
  row("Example QB4", "QB", "EX4", { passYd: 3800, passTd: 24, passInt: 12, rushYd: 90, rushTd: 1 }),
  row("Example QB5", "QB", "EX5", { passYd: 3600, passTd: 22, passInt: 13, rushYd: 60, rushTd: 1 }),
  row("Example QB6", "QB", "EX6", { passYd: 3400, passTd: 20, passInt: 12, rushYd: 200, rushTd: 3 }),

  row("Example RB1", "RB", "EX1", { rushYd: 1450, rushTd: 12, rec: 55, recYd: 420, recTd: 2 }),
  row("Example RB2", "RB", "EX2", { rushYd: 1250, rushTd: 10, rec: 40, recYd: 300, recTd: 1 }),
  row("Example RB3", "RB", "EX3", { rushYd: 1100, rushTd: 8, rec: 60, recYd: 480, recTd: 3 }),
  row("Example RB4", "RB", "EX4", { rushYd: 950, rushTd: 7, rec: 30, recYd: 220, recTd: 1 }),
  row("Example RB5", "RB", "EX5", { rushYd: 800, rushTd: 6, rec: 25, recYd: 180, recTd: 1 }),
  row("Example RB6", "RB", "EX6", { rushYd: 650, rushTd: 5, rec: 20, recYd: 150, recTd: 1 }),

  row("Example WR1", "WR", "EX1", { rec: 105, recYd: 1400, recTd: 10 }),
  row("Example WR2", "WR", "EX2", { rec: 95, recYd: 1250, recTd: 8 }),
  row("Example WR3", "WR", "EX3", { rec: 85, recYd: 1100, recTd: 7 }),
  row("Example WR4", "WR", "EX4", { rec: 75, recYd: 950, recTd: 6 }),
  row("Example WR5", "WR", "EX5", { rec: 65, recYd: 800, recTd: 5 }),
  row("Example WR6", "WR", "EX6", { rec: 55, recYd: 700, recTd: 4 }),

  row("Example TE1", "TE", "EX1", { rec: 80, recYd: 950, recTd: 8 }),
  row("Example TE2", "TE", "EX2", { rec: 65, recYd: 750, recTd: 6 }),
  row("Example TE3", "TE", "EX3", { rec: 50, recYd: 550, recTd: 4 }),
  row("Example TE4", "TE", "EX4", { rec: 40, recYd: 420, recTd: 3 }),
];
