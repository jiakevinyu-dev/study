"use client";

import { useEffect, useMemo, useState } from "react";
import { buildWarRoomBoard } from "@/lib/fantasy/engine";
import type { SleeperDraftPick } from "@/lib/fantasy/sleeper";
import {
  clearAllFantasyData,
  loadDefense,
  loadDraftPosition,
  loadDrafted,
  loadExcluded,
  loadGamesMissed,
  loadLeague,
  loadMyTeam,
  loadPlayers,
  loadPlayersSyncedAt,
  loadSchedule,
  loadWatchlist,
  saveDefense,
  saveDraftPosition,
  saveDrafted,
  saveExcluded,
  saveGamesMissed,
  saveLeague,
  saveMyTeam,
  savePlayers,
  saveSchedule,
  saveWatchlist,
  type DraftPosition,
} from "@/lib/fantasy/storage";
import { DEFAULT_LEAGUE, type DefenseRating, type LeagueSettings, type Player, type ScheduleEntry } from "@/lib/fantasy/types";
import { DataImportPanel } from "./data-import-panel";
import { Methodology } from "./methodology";
import { MyTeamPanel } from "./my-team-panel";
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
  excluded: Set<string>;
  myTeam: Set<string>;
  draftPosition: DraftPosition | null;
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
  excluded: new Set(),
  myTeam: new Set(),
  draftPosition: null,
};

export function WarRoom() {
  const [store, setStore] = useState<Store>(EMPTY_STORE);
  const { hydrated, players, syncedAt, league, schedule, defense, gamesMissed, watchlist, drafted, excluded, myTeam, draftPosition } =
    store;

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
      excluded: new Set(loadExcluded()),
      myTeam: new Set(loadMyTeam()),
      draftPosition: loadDraftPosition(),
    });
  }, []);

  useEffect(() => {
    if (hydrated) saveLeague(league);
  }, [league, hydrated]);
  useEffect(() => {
    if (hydrated) saveDraftPosition(draftPosition);
  }, [draftPosition, hydrated]);
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
  useEffect(() => {
    if (hydrated) saveExcluded([...excluded]);
  }, [excluded, hydrated]);
  useEffect(() => {
    if (hydrated) saveMyTeam([...myTeam]);
  }, [myTeam, hydrated]);

  // Excluded players (e.g. stale/retired entries a sync let through) are
  // dropped before the board is computed, so they can't skew replacement
  // levels for the position they'd otherwise occupy. Kept around separately
  // (by id, from the raw pool) purely so the UI can offer an undo.
  //
  // A relevance cutoff (default: ADP/search_rank worse than 250) is applied
  // the same way: Sleeper's full player dump runs to a couple thousand
  // names, most of them practice-squad, deep-inactive, or stale/misflagged
  // (retired players Sleeper's `active` flag didn't catch) entries no
  // redraft league will ever start, and that long tail is exactly what let
  // a single real standout at a position get merged into a "Tier 1"
  // alongside hundreds of irrelevant players. `undefined` (old localStorage
  // saved before this setting existed) falls back to the same default as a
  // fresh league. Anyone already on your roster or off the board stays
  // visible regardless — the cutoff only prunes the *unrostered* pool.
  const poolRelevanceCutoff = league.poolRelevanceCutoff ?? DEFAULT_LEAGUE.poolRelevanceCutoff;
  const activePlayers = useMemo(() => {
    return players.filter((p) => {
      if (excluded.has(p.id)) return false;
      if (poolRelevanceCutoff == null) return true;
      if (myTeam.has(p.id) || drafted.has(p.id)) return true;
      const rank = p.adp ?? p.searchRank;
      return rank == null || rank <= poolRelevanceCutoff;
    });
  }, [players, excluded, poolRelevanceCutoff, myTeam, drafted]);
  const excludedPlayers = useMemo(() => players.filter((p) => excluded.has(p.id)), [players, excluded]);

  const { rows, scarcity } = useMemo(
    () => buildWarRoomBoard(activePlayers, league, schedule, defense, gamesMissed),
    [activePlayers, league, schedule, defense, gamesMissed]
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
      // Roster/scoring/etc. come fresh from the synced league, but the pool
      // relevance cutoff and position caps are personal board preferences,
      // not league settings — keep whatever the user already had rather
      // than silently resetting them to the default on every sync.
      league: { ...newLeague, poolRelevanceCutoff: prev.league.poolRelevanceCutoff, positionCaps: prev.league.positionCaps },
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

  function markMine(id: string) {
    setStore((prev) => {
      const drafted = new Set(prev.drafted);
      const myTeam = new Set(prev.myTeam);
      drafted.add(id);
      myTeam.add(id);
      return { ...prev, drafted, myTeam };
    });
  }

  function markTaken(id: string) {
    setStore((prev) => {
      const drafted = new Set(prev.drafted);
      const myTeam = new Set(prev.myTeam);
      drafted.add(id);
      myTeam.delete(id);
      return { ...prev, drafted, myTeam };
    });
  }

  function undoPick(id: string) {
    setStore((prev) => {
      const drafted = new Set(prev.drafted);
      const myTeam = new Set(prev.myTeam);
      drafted.delete(id);
      myTeam.delete(id);
      return { ...prev, drafted, myTeam };
    });
  }

  function toggleExcluded(id: string) {
    setStore((prev) => {
      const next = new Set(prev.excluded);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { ...prev, excluded: next };
    });
  }

  function handleDraftSynced(
    newLeague: LeagueSettings,
    picks: SleeperDraftPick[],
    myUserId?: string,
    myDraftSlot?: number | null
  ) {
    const pickByPlayerId = new Map(picks.filter((p) => p.player_id).map((p) => [p.player_id, p.pick_no]));
    const myPlayerIds = new Set(
      myUserId ? picks.filter((p) => p.player_id && p.picked_by === myUserId).map((p) => p.player_id) : []
    );
    setStore((prev) => ({
      ...prev,
      // Same reasoning as handleLeagueDetected: the pool relevance cutoff and
      // position caps are personal board preferences, not part of the
      // draft's own settings.
      league: { ...newLeague, poolRelevanceCutoff: prev.league.poolRelevanceCutoff, positionCaps: prev.league.positionCaps },
      players: prev.players.map((p) =>
        pickByPlayerId.has(p.id)
          ? { ...p, adp: pickByPlayerId.get(p.id)!, rosteredBy: `Draft pick #${pickByPlayerId.get(p.id)}` }
          : p
      ),
      drafted: new Set(pickByPlayerId.keys()),
      // Preserve any manual "Mine" marks from outside this draft (e.g. a
      // player added via CSV before syncing) — i.e. anyone this draft hasn't
      // touched — on top of whatever the draft itself attributes to the
      // given Sleeper user id. A player this draft shows as picked by
      // someone else must NOT stay "Mine" just because it was true before
      // sync; that's what the previous (inverted) filter got backwards.
      myTeam: new Set([...prev.myTeam].filter((id) => !pickByPlayerId.has(id)).concat([...myPlayerIds])),
      // Powers the "will he be there next round?" scarcity estimate — needs
      // both where you sit in the snake order and how many picks have
      // actually happened so far in this specific draft.
      draftPosition: { myDraftSlot: myDraftSlot ?? prev.draftPosition?.myDraftSlot ?? null, pickCount: pickByPlayerId.size },
    }));
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

      <StatCards rows={rows} playerCount={activePlayers.length} />

      <div className="mt-6">
        <MyTeamPanel rows={rows} myTeam={myTeam} drafted={drafted} league={league} />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="space-y-6">
          <SyncPanel
            syncedAt={syncedAt}
            playerCount={players.length}
            onPlayersSynced={handlePlayersSynced}
            onLeagueDetected={handleLeagueDetected}
            onDraftSynced={handleDraftSynced}
          />
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
          <RankingsTable
            rows={rows}
            watchlist={watchlist}
            drafted={drafted}
            myTeam={myTeam}
            league={league}
            draftPosition={draftPosition}
            excludedPlayers={excludedPlayers}
            onToggleWatch={toggleWatch}
            onMarkMine={markMine}
            onMarkTaken={markTaken}
            onUndoPick={undoPick}
            onToggleExcluded={toggleExcluded}
          />
          <Methodology />
        </div>
      </div>

      {activePlayers.length === 0 && (
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
