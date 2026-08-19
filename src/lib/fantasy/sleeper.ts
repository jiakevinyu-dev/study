/**
 * Sleeper API client.
 *
 * Talks to the real, public, documented Sleeper REST API (https://docs.sleeper.com).
 * No API key is required for these read-only endpoints and they're CORS-friendly,
 * so this runs entirely client-side from the browser.
 *
 * Note: the sandbox this was built in has no outbound network access, so these
 * calls could not be exercised live during development — they're written strictly
 * against Sleeper's documented contract. Verify against a real league once deployed.
 */

import type { InjuryStatus, Player, Position } from "./types";

const BASE = "https://api.sleeper.app/v1";

const FANTASY_POSITIONS = new Set<Position>(["QB", "RB", "WR", "TE"]);

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { headers: { Accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`Sleeper request failed (${res.status}): ${path}`);
  }
  return (await res.json()) as T;
}

export type SleeperState = {
  season: string;
  week: number;
  season_type: string;
};

export async function fetchSleeperState(): Promise<SleeperState> {
  return getJson<SleeperState>("/state/nfl");
}

export type SleeperUser = {
  user_id: string;
  username: string;
  display_name: string;
};

export async function fetchSleeperUser(username: string): Promise<SleeperUser> {
  return getJson<SleeperUser>(`/user/${encodeURIComponent(username.trim())}`);
}

export type SleeperLeague = {
  league_id: string;
  name: string;
  season: string;
  total_rosters: number;
  roster_positions: string[];
  scoring_settings: Record<string, number>;
};

export async function fetchSleeperUserLeagues(userId: string, season: string): Promise<SleeperLeague[]> {
  return getJson<SleeperLeague[]>(`/user/${userId}/leagues/nfl/${season}`);
}

export async function fetchSleeperLeague(leagueId: string): Promise<SleeperLeague> {
  return getJson<SleeperLeague>(`/league/${leagueId.trim()}`);
}

export type SleeperRoster = {
  roster_id: number;
  owner_id: string | null;
  players: string[] | null;
};

export async function fetchSleeperRosters(leagueId: string): Promise<SleeperRoster[]> {
  return getJson<SleeperRoster[]>(`/league/${leagueId.trim()}/rosters`);
}

export type SleeperLeagueUser = {
  user_id: string;
  display_name: string;
  metadata?: { team_name?: string };
};

export async function fetchSleeperLeagueUsers(leagueId: string): Promise<SleeperLeagueUser[]> {
  return getJson<SleeperLeagueUser[]>(`/league/${leagueId.trim()}/users`);
}

/** Raw shape of a single entry in Sleeper's /players/nfl dump (trimmed to what we use). */
type SleeperPlayerRaw = {
  player_id: string;
  full_name?: string;
  first_name?: string;
  last_name?: string;
  position?: string | null;
  fantasy_positions?: string[] | null;
  team?: string | null;
  age?: number | null;
  years_exp?: number | null;
  status?: string | null;
  injury_status?: string | null;
  injury_body_part?: string | null;
  depth_chart_order?: number | null;
  search_rank?: number | null;
  active?: boolean;
};

/**
 * Fetches Sleeper's full NFL player dictionary. This payload is several MB —
 * Sleeper's own guidance is to call it at most once a day and cache the result
 * (see storage.ts, which persists it to localStorage with a timestamp).
 */
export async function fetchSleeperPlayers(): Promise<Player[]> {
  const raw = await getJson<Record<string, SleeperPlayerRaw>>("/players/nfl");
  const players: Player[] = [];

  for (const p of Object.values(raw)) {
    const position = (p.position ?? p.fantasy_positions?.[0]) as Position | undefined;
    if (!position || !FANTASY_POSITIONS.has(position)) continue;
    if (p.active === false && !p.team) continue;

    const name = p.full_name ?? [p.first_name, p.last_name].filter(Boolean).join(" ");
    if (!name) continue;

    players.push({
      id: p.player_id,
      name,
      position,
      team: p.team ?? null,
      age: p.age ?? null,
      yearsExp: p.years_exp ?? null,
      injuryStatus: normalizeInjuryStatus(p.injury_status),
      injuryBodyPart: p.injury_body_part ?? null,
      depthChartOrder: p.depth_chart_order ?? null,
      searchRank: p.search_rank ?? null,
      adp: null,
      projStats: null,
      source: "sleeper",
      rosteredBy: null,
    });
  }

  return players;
}

function normalizeInjuryStatus(raw: string | null | undefined): InjuryStatus {
  switch (raw) {
    case "Questionable":
    case "Doubtful":
    case "Out":
    case "IR":
    case "PUP":
    case "Suspended":
      return raw;
    default:
      return "Healthy";
  }
}

export type TrendingPlayer = {
  player_id: string;
  count: number;
};

export async function fetchSleeperTrending(
  type: "add" | "drop",
  lookbackHours = 24,
  limit = 25
): Promise<TrendingPlayer[]> {
  return getJson<TrendingPlayer[]>(`/players/nfl/trending/${type}?lookback_hours=${lookbackHours}&limit=${limit}`);
}

/**
 * Reads a Sleeper league's own settings and maps them onto our LeagueSettings
 * shape (roster slot counts + scoring) so the war room mirrors the real league
 * instead of the generic default. Fields Sleeper doesn't set fall back to the
 * standard PPR / no-TE-premium defaults.
 */
export function detectLeagueShape(league: SleeperLeague) {
  const rosterPositions = league.roster_positions ?? [];
  const count = (slot: string) => rosterPositions.filter((s) => s === slot).length;

  const roster = {
    QB: count("QB"),
    RB: count("RB"),
    WR: count("WR"),
    TE: count("TE"),
    FLEX: count("FLEX"),
    SUPER_FLEX: count("SUPER_FLEX") + count("QB/RB/WR/TE"),
    BENCH: count("BN"),
  };

  const scoring = league.scoring_settings ?? {};
  const isPpr = (scoring.rec ?? 0) > 0;
  const isSuperflex = roster.SUPER_FLEX > 0;
  const tePremium = scoring.bonus_rec_te ?? 0;

  return {
    teams: league.total_rosters ?? 12,
    roster,
    scoring: {
      passYd: scoring.pass_yd ?? 0.04,
      passTd: scoring.pass_td ?? 4,
      passInt: scoring.pass_int ?? -2,
      pass2pt: scoring.pass_2pt ?? 2,
      rushYd: scoring.rush_yd ?? 0.1,
      rushTd: scoring.rush_td ?? 6,
      rush2pt: scoring.rush_2pt ?? 2,
      rec: scoring.rec ?? 1,
      recYd: scoring.rec_yd ?? 0.1,
      recTd: scoring.rec_td ?? 6,
      teRecBonus: tePremium,
      rec2pt: scoring.rec_2pt ?? 2,
      fumbleLost: scoring.fum_lost ?? -2,
    },
    leagueName: league.name,
    sleeperLeagueId: league.league_id,
    detected: { isPpr, isSuperflex, tePremium: tePremium > 0 },
  };
}
