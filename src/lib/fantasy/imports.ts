/**
 * CSV → domain-type importers. Header matching is case/spacing-insensitive
 * and accepts common aliases from the exports people actually have lying
 * around (FantasyPros, Underdog, ESPN, a hand-built spreadsheet).
 */

import { parseCsv } from "./csv";
import type { DefenseRating, Player, Position, ScheduleEntry, StatProjection } from "./types";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];

function normalizeHeaderKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function pick(record: Record<string, string>, aliases: string[]): string | undefined {
  const normalized = new Map(Object.entries(record).map(([k, v]) => [normalizeHeaderKey(k), v]));
  for (const alias of aliases) {
    const v = normalized.get(normalizeHeaderKey(alias));
    if (v !== undefined && v !== "") return v;
  }
  return undefined;
}

function num(record: Record<string, string>, aliases: string[]): number | undefined {
  const raw = pick(record, aliases);
  if (raw == null) return undefined;
  const n = Number(raw.replace(/,/g, ""));
  return Number.isFinite(n) ? n : undefined;
}

/** Lowercase, strip suffixes/punctuation — used to fuzzy-match players across sources. */
export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/\b(jr|sr|ii|iii|iv|v)\b/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function parsePosition(raw: string | undefined): Position | null {
  const p = (raw ?? "").toUpperCase().trim() as Position;
  return POSITIONS.includes(p) ? p : null;
}

export type ImportedPlayerRow = {
  key: string; // normalizeName(name)
  name: string;
  position: Position;
  team: string | null;
  adp?: number;
  projStats?: StatProjection;
};

/** Rankings / ADP-only import: Player, Position, Team, ADP (or Rank). */
export function importRankingsCsv(text: string): ImportedPlayerRow[] {
  return parseCsv(text)
    .map((r) => {
      const name = pick(r, ["Player", "Name"]);
      const position = parsePosition(pick(r, ["Pos", "Position"]));
      if (!name || !position) return null;
      const adp = num(r, ["ADP", "Rank", "Overall Rank", "OverallRank"]);
      return {
        key: normalizeName(name),
        name,
        position,
        team: pick(r, ["Team", "Tm"]) ?? null,
        adp,
      } as ImportedPlayerRow;
    })
    .filter((r): r is ImportedPlayerRow => r != null);
}

/** Full stat-projection import: Player, Position, Team, plus raw counting stats. */
export function importProjectionsCsv(text: string): ImportedPlayerRow[] {
  return parseCsv(text)
    .map((r) => {
      const name = pick(r, ["Player", "Name"]);
      const position = parsePosition(pick(r, ["Pos", "Position"]));
      if (!name || !position) return null;

      const projStats: StatProjection = {
        passYd: num(r, ["PassYd", "Pass Yds", "PassingYards"]),
        passTd: num(r, ["PassTd", "Pass TD", "PassingTD"]),
        passInt: num(r, ["PassInt", "Int", "Interceptions"]),
        rushYd: num(r, ["RushYd", "Rush Yds", "RushingYards"]),
        rushTd: num(r, ["RushTd", "Rush TD", "RushingTD"]),
        rec: num(r, ["Rec", "Receptions"]),
        recYd: num(r, ["RecYd", "Rec Yds", "ReceivingYards"]),
        recTd: num(r, ["RecTd", "Rec TD", "ReceivingTD"]),
        fumbleLost: num(r, ["Fum", "FumLost", "Fumbles Lost"]),
      };

      return {
        key: normalizeName(name),
        name,
        position,
        team: pick(r, ["Team", "Tm"]) ?? null,
        adp: num(r, ["ADP"]),
        projStats,
      } as ImportedPlayerRow;
    })
    .filter((r): r is ImportedPlayerRow => r != null);
}

/** Schedule import: Team, Week, Opponent, HomeAway (Opponent = "BYE" for the bye week). */
export function importScheduleCsv(text: string): ScheduleEntry[] {
  return parseCsv(text)
    .map((r) => {
      const team = pick(r, ["Team", "Tm"]);
      const week = num(r, ["Week", "Wk"]);
      const opponent = pick(r, ["Opponent", "Opp"]);
      if (!team || !week || !opponent) return null;
      const homeAwayRaw = pick(r, ["HomeAway", "H/A", "Site"])?.toUpperCase();
      const homeAway = homeAwayRaw === "HOME" || homeAwayRaw === "H" ? "home" : homeAwayRaw === "AWAY" || homeAwayRaw === "A" ? "away" : null;
      return { team: team.toUpperCase(), week, opponent: opponent.toUpperCase() as ScheduleEntry["opponent"], homeAway } satisfies ScheduleEntry;
    })
    .filter((r): r is ScheduleEntry => r != null);
}

/** Defense-vs-position import: Team, Position, RankVsPosition (1 = toughest, 32 = easiest). */
export function importDefenseCsv(text: string): DefenseRating[] {
  return parseCsv(text)
    .map((r) => {
      const team = pick(r, ["Team", "Tm"]);
      const position = parsePosition(pick(r, ["Pos", "Position"]));
      const rank = num(r, ["RankVsPosition", "Rank", "DefRank"]);
      if (!team || !position || !rank) return null;
      return { team: team.toUpperCase(), position, rankVsPosition: rank } satisfies DefenseRating;
    })
    .filter((r): r is DefenseRating => r != null);
}

/** Injury-history import: Player, GamesMissed. Returns a map keyed by normalized name. */
export function importGamesMissedCsv(text: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of parseCsv(text)) {
    const name = pick(r, ["Player", "Name"]);
    const missed = num(r, ["GamesMissed", "Games Missed", "GM"]);
    if (name && missed != null) out[normalizeName(name)] = missed;
  }
  return out;
}

/**
 * Merges imported rows onto an existing player pool by fuzzy name match
 * (name, optionally narrowed by position when duplicate names collide).
 * Unmatched rows are appended as new manually-sourced players.
 */
export function mergeImportedRows(base: Player[], rows: ImportedPlayerRow[]): Player[] {
  const byKey = new Map<string, Player[]>();
  for (const p of base) {
    const key = normalizeName(p.name);
    const bucket = byKey.get(key) ?? [];
    bucket.push(p);
    byKey.set(key, bucket);
  }

  const result = [...base];
  for (const row of rows) {
    const candidates = byKey.get(row.key) ?? [];
    const match = candidates.find((c) => c.position === row.position) ?? candidates[0];
    if (match) {
      match.adp = row.adp ?? match.adp;
      match.projStats = row.projStats ?? match.projStats;
      if (row.team) match.team = row.team;
    } else {
      const newPlayer: Player = {
        id: `csv:${row.key}:${row.position}`,
        name: row.name,
        position: row.position,
        team: row.team,
        age: null,
        yearsExp: null,
        injuryStatus: "Healthy",
        injuryBodyPart: null,
        depthChartOrder: null,
        searchRank: null,
        adp: row.adp ?? null,
        projStats: row.projStats ?? null,
        source: "csv",
        rosteredBy: null,
      };
      result.push(newPlayer);
      byKey.set(row.key, [...(byKey.get(row.key) ?? []), newPlayer]);
    }
  }
  return result;
}
