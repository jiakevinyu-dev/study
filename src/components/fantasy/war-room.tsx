"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWarRoomBoard } from "@/lib/fantasy/engine";
import {
  clearAllFantasyData,
  loadDefense,
  loadDrafted,
  loadGamesMissed,
  loadLeague,
  loadPlayers,
  loadPlayersSyncedAt,
  loadSchedule,
  loadWatchlist,
  saveDefense,
  saveDrafted,
  saveGamesMissed,
  saveLeague,
  savePlayers,
  saveSchedule,
  saveWatchlist,
} from "@/lib/fantasy/storage";
import { DEFAULT_LEAGUE, type DefenseRating, type LeagueSettings, type Player, type ScheduleEntry } from "@/lib/fantasy/types";
import { DataImportPanel } from "./data-import-panel";
import { Methodology } from "./methodology";
import { RankingsTable } from "./rankings-table";
import { ScarcityChart } from "./scarcity-chart";
import { SettingsPanel } from "./settings-panel";
import { StatCards } from "./stat-cards";
import { SyncPanel } from "./sync-panel";
import { buttonSecondaryClass, Card } from "./ui";

type Store = {
  hydrated: boolean;
  players: Player[];
  syncedAt: number | null;
  league: LeagueSettings;
  schedule: ScheduleEntry[];
  defense: DefenseRating[];
  gamesMissed: Record<string, number>;
  watchlist: Set<string>;
  drafted: Set<string>;
};

const EMPTY_STORE: Store = {
  hydrated: false,
  players: [],
  syncedAt: null,
  league: DEFAULT_LEAGUE,
  schedule: [],
  defense: [],
  gamesMissed: {},
  watchlist: new Set(),
  drafted: new Set(),
};

export function WarRoom() {
  const [store, setStore] = useState<Store>(EMPTY_STORE);
  const { hydrated, players, syncedAt, league, schedule, defense, gamesMissed, watchlist, drafted } = store;

  // Hydrate from localStorage on mount. This is a deliberate exception to
  // react-hooks/set-state-in-effect: localStorage isn't readable during SSR,
  // and (unlike theme-provider.tsx's lazy-initializer trick) the mismatch
  // between an empty SSR pass and a fully-loaded client pass would be the
  // whole dashboard, not one class name — so we render the same "Loading…"
  // placeholder on both the server and the client's first pass (see the
  // `!hydrated` guard below) and only swap in real data after mount, in one
  // batched setState call.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStore({
      hydrated: true,
      players: loadPlayers(),
      syncedAt: loadPlayersSyncedAt(),
      league: loadLeague(),
      schedule: loadSchedule(),
      defense: loadDefense(),
      gamesMissed: loadGamesMissed(),
      watchlist: new Set(loadWatchlist()),
      drafted: new Set(loadDrafted()),
    });
  }, []);

  useEffect(() => {
    if (hydrated) saveLeague(league);
  }, [league, hydrated]);
  useEffect(() => {
    if (hydrated) saveSchedule(schedule);
  }, [schedule, hydrated]);
  useEffect(() => {
    if (hydrated) saveDefense(defense);
  }, [defense, hydrated]);
  useEffect(() => {
    if (hydrated) saveGamesMissed(gamesMissed);
  }, [gamesMissed, hydrated]);
  useEffect(() => {
    if (hydrated) saveWatchlist([...watchlist]);
  }, [watchlist, hydrated]);
  useEffect(() => {
    if (hydrated) saveDrafted([...drafted]);
  }, [drafted, hydrated]);

  const { rows, scarcity } = useMemo(
    () => buildWarRoomBoard(players, league, schedule, defense, gamesMissed),
    [players, league, schedule, defense, gamesMissed]
  );

  function setPlayers(next: Player[]) {
    setStore((prev) => ({ ...prev, players: next }));
  }

  function handlePlayersSynced(newPlayers: Player[]) {
    // Preserve any local overrides (ADP/projections imported via CSV) keyed by id.
    const overridesById = new Map(players.filter((p) => p.source !== "sleeper").map((p) => [p.id, p]));
    const merged = newPlayers.map((p) => overridesById.get(p.id) ?? p);
    setStore((prev) => ({ ...prev, players: merged, syncedAt: Date.now() }));
    savePlayers(merged);
  }

  function handleLeagueDetected(newLeague: LeagueSettings, rosteredByPlayerId: Map<string, string>) {
    setStore((prev) => ({
      ...prev,
      league: newLeague,
      players: prev.players.map((p) => ({ ...p, rosteredBy: rosteredByPlayerId.get(p.id) ?? null })),
    }));
  }

  function toggleWatch(id: string) {
    setStore((prev) => {
      const next = new Set(prev.watchlist);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, watchlist: next };
    });
  }

  function toggleDrafted(id: string) {
    setStore((prev) => {
      const next = new Set(prev.drafted);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, drafted: next };
    });
  }

  function resetAll() {
    if (!window.confirm("Clear all synced players, settings, and imports? This can't be undone.")) return;
    clearAllFantasyData();
    setStore({ ...EMPTY_STORE, hydrated: true });
  }

  if (!hydrated) {
    return <div className="mx-auto max-w-6xl px-5 py-24 text-center text-sm text-muted sm:px-8">Loading war room…</div>;
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent">Redraft War Room</p>
          <h1 className="mt-3 text-balance font-display text-3xl font-medium tracking-tight text-fg sm:text-4xl">
            {league.leagueName ?? "12-Team Superflex PPR — No TE Premium"}
          </h1>
          <p className="mt-4 text-base leading-relaxed text-muted">
            A live, computed draft board — not a static list. Sync your Sleeper league, tune the scoring and roster
            settings to match yours exactly, and every ranking, scarcity tier, and value below recomputes on the
            spot.
          </p>
        </div>
        <button type="button" onClick={resetAll} className={buttonSecondaryClass}>
          Reset all data
        </button>
      </div>

      <StatCards rows={rows} playerCount={players.length} />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <SyncPanel syncedAt={syncedAt} playerCount={players.length} onPlayersSynced={handlePlayersSynced} onLeagueDetected={handleLeagueDetected} />
          <SettingsPanel league={league} onChange={(l) => setStore((prev) => ({ ...prev, league: l }))} />
          <DataImportPanel
            players={players}
            schedule={schedule}
            defense={defense}
            gamesMissedCount={Object.keys(gamesMissed).length}
            onPlayersChange={(p) => {
              setPlayers(p);
              savePlayers(p);
            }}
            onScheduleChange={(s) => setStore((prev) => ({ ...prev, schedule: s }))}
            onDefenseChange={(d) => setStore((prev) => ({ ...prev, defense: d }))}
            onGamesMissedChange={(g) => setStore((prev) => ({ ...prev, gamesMissed: g }))}
          />
        </div>

        <div className="space-y-6">
          <ScarcityChart scarcity={scarcity} teams={league.teams} />
          <RankingsTable rows={rows} watchlist={watchlist} drafted={drafted} onToggleWatch={toggleWatch} onToggleDrafted={toggleDrafted} />
          <Methodology />
        </div>
      </div>

      {players.length === 0 && (
        <Card className="mt-6 text-center">
          <p className="text-sm text-muted">
            Nothing synced yet. Use <span className="font-medium text-fg">Sleeper Sync</span> above, or load the
            example dataset under <span className="font-medium text-fg">Data Sources</span> to see the engine work.
          </p>
        </Card>
      )}
    </div>
  );
}
