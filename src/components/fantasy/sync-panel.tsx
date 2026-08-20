"use client";

import { useEffect, useState } from "react";
import { RefreshCw, Search } from "lucide-react";
import {
  detectDraftShape,
  detectLeagueShape,
  fetchSleeperDraft,
  fetchSleeperDraftPicks,
  fetchSleeperLeague,
  fetchSleeperLeagueDrafts,
  fetchSleeperLeagueUsers,
  fetchSleeperPlayers,
  fetchSleeperRosters,
  fetchSleeperUser,
  fetchSleeperUserLeagues,
  type SleeperDraftPick,
  type SleeperDraftSummary,
  type SleeperLeague,
} from "@/lib/fantasy/sleeper";
import { loadDraftSync, saveDraftSync } from "@/lib/fantasy/storage";
import { DEFAULT_LEAGUE, type LeagueSettings, type Player } from "@/lib/fantasy/types";
import { Badge, buttonPrimaryClass, buttonSecondaryClass, Card, FieldLabel, inputClass } from "./ui";

type Props = {
  syncedAt: number | null;
  playerCount: number;
  onPlayersSynced: (players: Player[]) => void;
  onLeagueDetected: (league: LeagueSettings, rosteredByPlayerId: Map<string, string>) => void;
  onDraftSynced: (league: LeagueSettings, picks: SleeperDraftPick[], myUserId?: string, myDraftSlot?: number | null) => void;
};

export function SyncPanel({ syncedAt, playerCount, onPlayersSynced, onLeagueDetected, onDraftSynced }: Props) {
  const [playerSyncState, setPlayerSyncState] = useState<"idle" | "loading" | "error">("idle");
  const [playerSyncError, setPlayerSyncError] = useState<string | null>(null);

  const [leagueId, setLeagueId] = useState("");
  const [username, setUsername] = useState("");
  const [leagueSyncState, setLeagueSyncState] = useState<"idle" | "loading" | "error">("idle");
  const [leagueSyncError, setLeagueSyncError] = useState<string | null>(null);
  const [foundLeagues, setFoundLeagues] = useState<SleeperLeague[]>([]);
  const [appliedLeagueName, setAppliedLeagueName] = useState<string | null>(null);
  const [leagueDrafts, setLeagueDrafts] = useState<SleeperDraftSummary[]>([]);

  const [draftInput, setDraftInput] = useState("");
  const [myUsername, setMyUsername] = useState("");
  const [draftSyncState, setDraftSyncState] = useState<"idle" | "loading" | "error">("idle");
  const [draftSyncError, setDraftSyncError] = useState<string | null>(null);
  const [draftSummary, setDraftSummary] = useState<{ id: string; status: string; pickCount: number; myPickCount: number | null } | null>(
    null
  );
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastPolledAt, setLastPolledAt] = useState<number | null>(null);
  const [hydrated, setHydrated] = useState(false);

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
          // war-room.tsx's handler preserves whatever the user already had
          // set here — this default is just a type-satisfying placeholder.
          poolRelevanceCutoff: DEFAULT_LEAGUE.poolRelevanceCutoff,
        },
        rosteredByPlayerId
      );
      setAppliedLeagueName(shape.leagueName);
      // Carry the username used to find this league over to the draft-sync
      // field too, if that one's still empty — it's almost always the same
      // person, and it's what lets the draft slot auto-detect below work
      // without asking twice.
      if (username.trim() && !myUsername.trim()) setMyUsername(username.trim());

      // A league's draft(s) are discoverable without ever pasting an ID —
      // most leagues only ever have one. Non-fatal if this fails; the
      // manual draft ID/URL field below still works either way.
      try {
        const drafts = await fetchSleeperLeagueDrafts(id);
        setLeagueDrafts(drafts);
        if (drafts.length > 0 && !draftInput) setDraftInput(drafts[0].draft_id);
      } catch {
        setLeagueDrafts([]);
      }

      setLeagueSyncState("idle");
    } catch (err) {
      setLeagueSyncState("error");
      setLeagueSyncError(err instanceof Error ? err.message : "League sync failed");
    }
  }

  async function syncDraft(input: string, myUsernameInput: string, opts: { silent?: boolean } = {}) {
    if (!opts.silent) {
      setDraftSyncState("loading");
      setDraftSyncError(null);
    }
    try {
      const draft = await fetchSleeperDraft(input);
      const picks = await fetchSleeperDraftPicks(input);
      const shape = detectDraftShape(draft);

      let myUserId: string | undefined;
      let myDraftSlot: number | null = null;
      if (myUsernameInput.trim()) {
        try {
          myUserId = (await fetchSleeperUser(myUsernameInput)).user_id;
          myDraftSlot = draft.draft_order?.[myUserId] ?? null;
        } catch {
          // Non-fatal — the draft still syncs, it just can't auto-tag "Mine" picks.
          if (!opts.silent) setDraftSyncError(`Synced the draft, but couldn't find Sleeper user "${myUsernameInput}" to tag your picks.`);
        }
      }

      // League settings (teams, roster slots, scoring) come straight from
      // the draft's own settings every sync — there's nothing to configure
      // separately once you're pointed at a draft.
      onDraftSynced(
        {
          teams: shape.teams,
          scoring: shape.scoring,
          roster: shape.roster,
          playoffWeeks: [15, 16, 17],
          leagueName: `Sleeper draft ${draft.draft_id} (${draft.status})`,
          // war-room.tsx's handler preserves whatever the user already had
          // set here — this default is just a type-satisfying placeholder.
          poolRelevanceCutoff: DEFAULT_LEAGUE.poolRelevanceCutoff,
        },
        picks,
        myUserId,
        myDraftSlot
      );
      setDraftSummary({
        id: draft.draft_id,
        status: draft.status,
        pickCount: picks.filter((p) => p.player_id).length,
        myPickCount: myUserId ? picks.filter((p) => p.player_id && p.picked_by === myUserId).length : null,
      });
      setLastPolledAt(Date.now());
      if (!opts.silent) setDraftSyncState("idle");
    } catch (err) {
      if (!opts.silent) {
        setDraftSyncState("error");
        setDraftSyncError(err instanceof Error ? err.message : "Draft sync failed — check the draft ID or URL");
      }
      // A silent background poll that fails (e.g. a transient network blip)
      // just tries again next interval rather than surfacing an error.
    }
  }

  // Resume whatever draft was connected before the last reload. Without
  // this, the connection (and the interval below) lived only in this
  // component's state — a refresh, tab close, or nav away mid-draft went
  // quiet with no signal, and every pick made after that point needed a
  // manual "Mine"/"Taken" click again even though a draft was "synced."
  useEffect(() => {
    const saved = loadDraftSync();
    if (saved) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage on mount, same pattern as war-room.tsx
      setDraftInput(saved.draftId);
      setMyUsername(saved.myUsername);
      setAutoRefresh(saved.autoRefresh);
      syncDraft(saved.draftId, saved.myUsername, { silent: true });
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep the connection (and the username/auto-refresh prefs) saved for as
  // long as a draft is actually connected, so the effect above can resume it.
  useEffect(() => {
    if (!hydrated || !draftSummary) return;
    saveDraftSync({ draftId: draftSummary.id, myUsername, autoRefresh });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSummary?.id, myUsername, autoRefresh, hydrated]);

  // Poll picks automatically so Mine/Taken status and the board update as
  // the draft happens — no manual "Refresh picks" clicks needed. This has to
  // keep polling through "pre_draft" too, not just "drafting": if you sync
  // before the draft room opens (the normal time to paste the link) or
  // resume a saved pre-draft connection, "drafting" is a status this same
  // poll is the only thing that would ever discover — gating the interval on
  // it already being "drafting" meant it could never start, and the panel
  // sat frozen at 0 picks even once the real draft was well underway. Only
  // "complete" actually has nothing left to learn.
  useEffect(() => {
    if (!draftSummary || !autoRefresh || draftSummary.status === "complete") return;
    const id = setInterval(() => {
      syncDraft(draftSummary.id, myUsername, { silent: true });
    }, 6000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draftSummary?.id, draftSummary?.status, autoRefresh, myUsername]);

  function disconnectDraft() {
    setDraftSummary(null);
    setDraftSyncError(null);
    saveDraftSync(null);
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
            {leagueDrafts.length > 0 && " Its draft is pre-filled below — add your username and hit Sync draft."}
          </p>
        )}
      </div>

      <div className="mt-6 space-y-3 border-t border-border pt-5">
        <FieldLabel>Mock draft / live draft (marks picks off the board as they happen)</FieldLabel>
        <p className="text-xs text-muted">
          Paste the draft ID or the URL from a Sleeper mock (or a real league&rsquo;s in-progress draft). League
          settings (teams, roster slots, scoring) come straight from the draft itself — nothing to configure
          separately. Every picked player is marked drafted and gets his pick number as ADP — the actual order this
          draft picked him, more accurate than any generic ranking. Add your Sleeper username and your own picks
          auto-tag as &ldquo;Mine&rdquo; for the My Team panel as they happen — while the draft is live, this polls
          automatically every few seconds, so you don&rsquo;t have to click Mine or Taken yourself. The connection
          survives a refresh or a closed tab too — reopening this page picks the same draft back up and resumes
          polling on its own.
        </p>
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <input
              className={inputClass}
              placeholder="Draft ID or sleeper.com/draft/nfl/… URL"
              value={draftInput}
              onChange={(e) => setDraftInput(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[160px]">
            <input
              className={inputClass}
              placeholder="Your username (optional)"
              value={myUsername}
              onChange={(e) => setMyUsername(e.target.value)}
            />
          </div>
          <button
            type="button"
            onClick={() => syncDraft(draftInput, myUsername)}
            disabled={!draftInput || draftSyncState === "loading"}
            className={buttonSecondaryClass}
          >
            <RefreshCw className={draftSyncState === "loading" ? "mr-2 h-3.5 w-3.5 animate-spin" : "mr-2 h-3.5 w-3.5"} aria-hidden="true" />
            Sync draft
          </button>
        </div>

        {draftSyncState === "error" && <p className="text-xs text-red-600 dark:text-red-400">{draftSyncError}</p>}
        {draftSummary && (
          <div className="space-y-2 rounded-lg bg-bg-inset px-3 py-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs text-emerald-700 dark:text-emerald-400">
                  {draftSummary.status !== "complete" && autoRefresh && (
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500 align-middle" aria-hidden="true" />
                  )}
                  Draft {draftSummary.id} &middot; {draftSummary.status} &middot; {draftSummary.pickCount} picks on the board
                </p>
                <p className={draftSummary.myPickCount ? "text-xs text-emerald-700 dark:text-emerald-400" : "text-xs text-amber-700 dark:text-amber-400"}>
                  {draftSummary.myPickCount != null
                    ? `${draftSummary.myPickCount} tagged as yours`
                    : "No username set — none of these picks are being tagged as yours"}
                </p>
              </div>
              <span className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => syncDraft(draftSummary.id, myUsername)}
                  className="text-xs font-medium text-accent hover:underline"
                >
                  Refresh now
                </button>
                <button type="button" onClick={disconnectDraft} className="text-xs font-medium text-muted hover:underline">
                  Stop syncing
                </button>
              </span>
            </div>
            {draftSummary.status !== "complete" && (
              <div className="flex items-center justify-between gap-2">
                <label className="flex items-center gap-1.5 text-xs text-muted">
                  <input type="checkbox" checked={autoRefresh} onChange={(e) => setAutoRefresh(e.target.checked)} />
                  {draftSummary.status === "pre_draft" ? "Auto-refresh every 6s — watching for the draft to start" : "Auto-refresh every 6s while drafting"}
                </label>
                {lastPolledAt && <span className="text-[11px] text-muted">Last update {new Date(lastPolledAt).toLocaleTimeString()}</span>}
              </div>
            )}
          </div>
        )}
        {draftSyncState !== "error" && draftSyncError && <p className="text-xs text-amber-700 dark:text-amber-400">{draftSyncError}</p>}
      </div>
    </Card>
  );
}
