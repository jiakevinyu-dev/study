"use client";

import { useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import {
  detectLeagueShape,
  fetchSleeperLeague,
  fetchSleeperLeagueUsers,
  fetchSleeperPlayers,
  fetchSleeperRosters,
  fetchSleeperUser,
  fetchSleeperUserLeagues,
  type SleeperLeague,
} from "@/lib/fantasy/sleeper";
import type { LeagueSettings, Player } from "@/lib/fantasy/types";
import { Badge, buttonPrimaryClass, buttonSecondaryClass, Card, FieldLabel, inputClass } from "./ui";

type Props = {
  syncedAt: number | null;
  playerCount: number;
  onPlayersSynced: (players: Player[]) => void;
  onLeagueDetected: (league: LeagueSettings, rosteredByPlayerId: Map<string, string>) => void;
};

export function SyncPanel({ syncedAt, playerCount, onPlayersSynced, onLeagueDetected }: Props) {
  const [playerSyncState, setPlayerSyncState] = useState<"idle" | "loading" | "error">("idle");
  const [playerSyncError, setPlayerSyncError] = useState<string | null>(null);

  const [leagueId, setLeagueId] = useState("");
  const [username, setUsername] = useState("");
  const [leagueSyncState, setLeagueSyncState] = useState<"idle" | "loading" | "error">("idle");
  const [leagueSyncError, setLeagueSyncError] = useState<string | null>(null);
  const [foundLeagues, setFoundLeagues] = useState<SleeperLeague[]>([]);
  const [appliedLeagueName, setAppliedLeagueName] = useState<string | null>(null);

  async function syncPlayers() {
    setPlayerSyncState("loading");
    setPlayerSyncError(null);
    try {
      const players = await fetchSleeperPlayers();
      onPlayersSynced(players);
      setPlayerSyncState("idle");
    } catch (err) {
      setPlayerSyncState("error");
      setPlayerSyncError(err instanceof Error ? err.message : "Sync failed");
    }
  }

  async function findLeaguesByUsername() {
    setLeagueSyncState("loading");
    setLeagueSyncError(null);
    setFoundLeagues([]);
    try {
      const user = await fetchSleeperUser(username);
      const season = new Date().getFullYear().toString();
      const leagues = await fetchSleeperUserLeagues(user.user_id, season);
      setFoundLeagues(leagues);
      if (leagues.length === 0) {
        setLeagueSyncError(`No ${season} leagues found for "${username}". Try the league ID instead.`);
      }
      setLeagueSyncState("idle");
    } catch (err) {
      setLeagueSyncState("error");
      setLeagueSyncError(err instanceof Error ? err.message : "Lookup failed");
    }
  }

  async function applyLeague(id: string) {
    setLeagueSyncState("loading");
    setLeagueSyncError(null);
    try {
      const league = await fetchSleeperLeague(id);
      const shape = detectLeagueShape(league);

      // Pull rosters so already-drafted/rostered players can be flagged.
      const [rosters, users] = await Promise.all([fetchSleeperRosters(id), fetchSleeperLeagueUsers(id)]);
      const nameByUserId = new Map(users.map((u) => [u.user_id, u.metadata?.team_name || u.display_name]));
      const rosteredByPlayerId = new Map<string, string>();
      for (const roster of rosters) {
        const teamName = roster.owner_id ? nameByUserId.get(roster.owner_id) ?? "Unowned" : "Unowned";
        for (const pid of roster.players ?? []) rosteredByPlayerId.set(pid, teamName);
      }

      onLeagueDetected(
        {
          teams: shape.teams,
          scoring: shape.scoring,
          roster: shape.roster,
          playoffWeeks: [15, 16, 17],
          leagueName: shape.leagueName,
          sleeperLeagueId: shape.sleeperLeagueId,
        },
        rosteredByPlayerId
      );
      setAppliedLeagueName(shape.leagueName);
      setLeagueSyncState("idle");
    } catch (err) {
      setLeagueSyncState("error");
      setLeagueSyncError(err instanceof Error ? err.message : "League sync failed");
    }
  }

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-medium text-fg">Sleeper Sync</h3>
        <Badge tone={playerCount > 0 ? "good" : "neutral"}>{playerCount > 0 ? "Live pool" : "Not synced"}</Badge>
      </div>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        Pulls straight from Sleeper&rsquo;s public API — the full player pool (names, teams, age, live injury
        designations) and, optionally, your real league&rsquo;s roster slots and scoring so the board matches your
        actual rules instead of the defaults.
      </p>

      <div className="mt-5 space-y-2">
        <FieldLabel>Player pool</FieldLabel>
        <div className="flex items-center gap-3">
          <button type="button" onClick={syncPlayers} disabled={playerSyncState === "loading"} className={buttonPrimaryClass}>
            <RefreshCw className={playerSyncState === "loading" ? "mr-2 h-3.5 w-3.5 animate-spin" : "mr-2 h-3.5 w-3.5"} aria-hidden="true" />
            {playerSyncState === "loading" ? "Syncing…" : "Sync players"}
          </button>
          <span className="text-xs text-muted">
            {syncedAt ? `Last synced ${new Date(syncedAt).toLocaleString()}` : "Sleeper recommends syncing at most once a day"}
          </span>
        </div>
        {playerSyncState === "error" && <p className="text-xs text-red-600 dark:text-red-400">{playerSyncError}</p>}
      </div>

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <FieldLabel>League (optional — auto-detects roster & scoring)</FieldLabel>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <input
              className={inputClass}
              placeholder="Sleeper username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={findLeaguesByUsername}
            disabled={!username || leagueSyncState === "loading"}
            className={buttonSecondaryClass}
          >
            <Search className="mr-2 h-3.5 w-3.5" aria-hidden="true" />
            Find leagues
          </button>
        </div>

        {foundLeagues.length > 0 && (
          <ul className="space-y-1.5">
            {foundLeagues.map((l) => (
              <li key={l.league_id} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="truncate text-fg">{l.name}</span>
                <button type="button" onClick={() => applyLeague(l.league_id)} className="shrink-0 text-xs font-medium text-accent hover:underline">
                  Use this league
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <input className={inputClass} placeholder="…or paste a league ID directly" value={leagueId} onChange={(e) => setLeagueId(e.target.value)} />
          </div>
          <button type="button" onClick={() => applyLeague(leagueId)} disabled={!leagueId || leagueSyncState === "loading"} className={buttonSecondaryClass}>
            Apply
          </button>
        </div>

        {leagueSyncState === "error" && <p className="text-xs text-red-600 dark:text-red-400">{leagueSyncError}</p>}
        {appliedLeagueName && leagueSyncState === "idle" && !leagueSyncError && (
          <p className="text-xs text-emerald-700 dark:text-emerald-400">
            Applied settings from &ldquo;{appliedLeagueName}&rdquo; — review them below before you draft.
          </p>
        )}
      </div>
    </Card>
  );
}
