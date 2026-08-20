/**
 * localStorage persistence. Everything the war room knows — synced players,
 * league settings, imported schedule/defense/injury-history data, and the
 * draft-board watchlist — survives a refresh so a live draft doesn't lose
 * state mid-pick. All reads are guarded for SSR (window undefined) and bad
 * JSON, and fail soft to the caller's default.
 */

import type { DefenseRating, LeagueSettings, Player, ScheduleEntry } from "./types";
import { DEFAULT_LEAGUE } from "./types";

const KEYS = {
  players: "ff-war-room:players",
  playersSyncedAt: "ff-war-room:players-synced-at",
  league: "ff-war-room:league",
  schedule: "ff-war-room:schedule",
  defense: "ff-war-room:defense",
  gamesMissed: "ff-war-room:games-missed",
  watchlist: "ff-war-room:watchlist",
  drafted: "ff-war-room:drafted",
  excluded: "ff-war-room:excluded",
  myTeam: "ff-war-room:my-team",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — silently no-op, state stays in-memory
  }
}

export const loadPlayers = () => read<Player[]>(KEYS.players, []);
export const savePlayers = (players: Player[]) => {
  write(KEYS.players, players);
  write(KEYS.playersSyncedAt, Date.now());
};
export const loadPlayersSyncedAt = () => read<number | null>(KEYS.playersSyncedAt, null);

export const loadLeague = () => read<LeagueSettings>(KEYS.league, DEFAULT_LEAGUE);
export const saveLeague = (league: LeagueSettings) => write(KEYS.league, league);

export const loadSchedule = () => read<ScheduleEntry[]>(KEYS.schedule, []);
export const saveSchedule = (schedule: ScheduleEntry[]) => write(KEYS.schedule, schedule);

export const loadDefense = () => read<DefenseRating[]>(KEYS.defense, []);
export const saveDefense = (defense: DefenseRating[]) => write(KEYS.defense, defense);

export const loadGamesMissed = () => read<Record<string, number>>(KEYS.gamesMissed, {});
export const saveGamesMissed = (map: Record<string, number>) => write(KEYS.gamesMissed, map);

export const loadWatchlist = () => read<string[]>(KEYS.watchlist, []);
export const saveWatchlist = (ids: string[]) => write(KEYS.watchlist, ids);

export const loadDrafted = () => read<string[]>(KEYS.drafted, []);
export const saveDrafted = (ids: string[]) => write(KEYS.drafted, ids);

/** Players manually excluded from the board — e.g. stale/retired entries that slipped through a sync. */
export const loadExcluded = () => read<string[]>(KEYS.excluded, []);
export const saveExcluded = (ids: string[]) => write(KEYS.excluded, ids);

/** Players drafted onto *your* roster specifically — a subset of `drafted`. */
export const loadMyTeam = () => read<string[]>(KEYS.myTeam, []);
export const saveMyTeam = (ids: string[]) => write(KEYS.myTeam, ids);

export function clearAllFantasyData() {
  if (typeof window === "undefined") return;
  Object.values(KEYS).forEach((k) => window.localStorage.removeItem(k));
}
