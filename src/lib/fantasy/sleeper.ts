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
    // Require active === true explicitly, not just "not flagged inactive with
    // no team." Sleeper's dump keeps long-retired players (e.g. Todd Gurley)
    // indefinitely, and often leaves a stale `team` on file for them — so the
    // looser "inactive AND no team" check let retired players slip through
    // and get ranked. `active === true` is the one field Sleeper reliably
    // flips off for anyone no longer on an NFL roster.
    if (p.active !== true) continue;

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
 * Accepts either a raw Sleeper draft ID or a pasted mock-draft URL
 * (e.g. https://sleeper.com/draft/nfl/1124...  or the app-share link) and
 * pulls out the numeric draft ID.
 */
export function parseDraftId(input: string): string {
  const trimmed = input.trim();
  const match = trimmed.match(/(\d{10,})/);
  return match ? match[1] : trimmed;
}

export type SleeperDraft = {
  draft_id: string;
  type: "snake" | "linear" | "auction" | string;
  status: "pre_draft" | "drafting" | "complete" | string;
  season: string;
  settings: {
    teams?: number;
    rounds?: number;
    slots_qb?: number;
    slots_rb?: number;
    slots_wr?: number;
    slots_te?: number;
    slots_flex?: number;
    slots_super_flex?: number;
    slots_bn?: number;
  };
  metadata?: { scoring_type?: string };
};

/** Mock drafts and live/in-progress league drafts are both fetched the same way. */
export async function fetchSleeperDraft(draftId: string): Promise<SleeperDraft> {
  return getJson<SleeperDraft>(`/draft/${parseDraftId(draftId)}`);
}

export type SleeperDraftPick = {
  pick_no: number;
  player_id: string;
  roster_id: number | null;
  picked_by: string | null;
};

export async function fetchSleeperDraftPicks(draftId: string): Promise<SleeperDraftPick[]> {
  return getJson<SleeperDraftPick[]>(`/draft/${parseDraftId(draftId)}/picks`);
}

/** Maps a Sleeper draft's settings (mock or real) onto our LeagueSettings shape. */
export function detectDraftShape(draft: SleeperDraft) {
  const s = draft.settings ?? {};
  const scoringType = draft.metadata?.scoring_type ?? "ppr";
  const rec = scoringType.startsWith("half") ? 0.5 : scoringType.startsWith("std") ? 0 : 1;

  const roster = {
    QB: s.slots_qb ?? 1,
    RB: s.slots_rb ?? 2,
    WR: s.slots_wr ?? 2,
    TE: s.slots_te ?? 1,
    FLEX: s.slots_flex ?? 1,
    SUPER_FLEX: s.slots_super_flex ?? 0,
    BENCH: s.slots_bn ?? 6,
  };

  return {
    teams: s.teams ?? 12,
    roster,
    scoring: { ...DEFAULT_SCORING_FALLBACK, rec },
  };
}

const DEFAULT_SCORING_FALLBACK = {
  passYd: 0.04,
  passTd: 4,
  passInt: -2,
  pass2pt: 2,
  rushYd: 0.1,
  rushTd: 6,
  rush2pt: 2,
  rec: 1,
  recYd: 0.1,
  recTd: 6,
  teRecBonus: 0,
  rec2pt: 2,
  fumbleLost: -2,
};

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
