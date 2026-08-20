"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Ban, Shirt, Star, Undo2, X } from "lucide-react";
import { computeTeamStrength } from "@/lib/fantasy/team-strength";
import type { LeagueSettings, Player, Position, WarRoomRow } from "@/lib/fantasy/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

type SortKey = "composite" | "vbd" | "cliff" | "tier" | "points" | "adp" | "delta" | "injury" | "sos";

const POSITION_FILTERS: ("ALL" | Position)[] = ["ALL", "QB", "RB", "WR", "TE"];

const INJURY_TONE: Record<WarRoomRow["injury"]["tier"], "good" | "warn" | "bad" | "neutral"> = {
  Low: "good",
  Moderate: "neutral",
  Elevated: "warn",
  High: "bad",
};

type Props = {
  rows: WarRoomRow[];
  watchlist: Set<string>;
  drafted: Set<string>;
  myTeam: Set<string>;
  league: LeagueSettings;
  excludedPlayers: Player[];
  onToggleWatch: (id: string) => void;
  onMarkMine: (id: string) => void;
  onMarkTaken: (id: string) => void;
  onUndoPick: (id: string) => void;
  onToggleExcluded: (id: string) => void;
};

export function RankingsTable({
  rows,
  watchlist,
  drafted,
  myTeam,
  league,
  excludedPlayers,
  onToggleWatch,
  onMarkMine,
  onMarkTaken,
  onUndoPick,
  onToggleExcluded,
}: Props) {
  const [search, setSearch] = useState("");
  const [posFilter, setPosFilter] = useState<"ALL" | Position>("ALL");
  // Default to pure value-over-replacement, not the risk-adjusted composite —
  // this is what "always draft the best value available" means mechanically.
  const [sortKey, setSortKey] = useState<SortKey>("vbd");
  const [sortDir, setSortDir] = useState<1 | -1>(-1);
  const [hideDrafted, setHideDrafted] = useState(true);
  const [watchOnly, setWatchOnly] = useState(false);

  function sortValue(r: WarRoomRow, key: SortKey) {
    switch (key) {
      case "composite":
        return r.compositeValue;
      case "vbd":
        return r.vbd;
      case "cliff":
        return r.cliff;
      case "tier":
        // Sort ascending-friendly: earlier (smaller) tier number ranks
        // higher, and within a tier a lonelier one (smaller tierSize) ranks
        // higher — so the default desc click surfaces the scarcest players.
        return -(r.tier * 1000 + r.tierSize);
      case "points":
        return r.points;
      case "adp":
        return -(r.adp ?? r.searchRank ?? 9999);
      case "delta":
        return r.valueDelta ?? -9999;
      case "injury":
        return r.injury.score;
      case "sos":
        return r.sos.playoffGrade ?? r.sos.fullSeasonGrade ?? -1;
    }
  }

  const filtered = useMemo(() => {
    let out = rows;
    if (posFilter !== "ALL") out = out.filter((r) => r.position === posFilter);
    if (hideDrafted) out = out.filter((r) => !drafted.has(r.id));
    if (watchOnly) out = out.filter((r) => watchlist.has(r.id));
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      out = out.filter((r) => r.name.toLowerCase().includes(q) || (r.team ?? "").toLowerCase().includes(q));
    }
    return [...out].sort((a, b) => (sortValue(a, sortKey) - sortValue(b, sortKey)) * sortDir);
  }, [rows, posFilter, hideDrafted, watchOnly, search, sortKey, sortDir, drafted, watchlist]);

  // The recommendation is always computed independent of the visible
  // sort/filter (position filter aside) so the banner is a stable draft
  // recommendation, not just "whatever's on top of the table right now."
  //
  // It's team-aware, not just "highest VBD available": for each undrafted
  // candidate, run the same starting-lineup simulation the My Team panel
  // uses on (my current roster + candidate) and see how much it actually
  // raises my starting VBD. A great QB when SUPERFLEX and QB are both
  // already started is worth ~0 marginal value; an ordinary TE filling an
  // empty TE slot can outrank him. When the roster is empty this reduces
  // to exactly the old "best VBD available" behavior, since marginal value
  // is then just the candidate's own VBD — so it's a strict upgrade, not a
  // different feature.
  const myRoster = useMemo(() => rows.filter((r) => myTeam.has(r.id)), [rows, myTeam]);
  const myStrength = useMemo(() => computeTeamStrength(myRoster, league), [myRoster, league]);
  const baseStartingVbd = myStrength.startingVbd;

  const recommended = useMemo(() => {
    // Once every starting slot AND every bench slot is filled, there's
    // nothing left to recommend — bench capacity is a real roster limit
    // (league.roster.BENCH), not an afterthought the marginal-value math
    // should keep grinding against forever.
    if (myStrength.rosterFull) return null;
    let pool = rows.filter((r) => !drafted.has(r.id));
    if (posFilter !== "ALL") pool = pool.filter((r) => r.position === posFilter);
    if (pool.length === 0) return null;

    const scored = pool.map((player) => {
      const marginal =
        Math.round((computeTeamStrength([...myRoster, player], league).startingVbd - baseStartingVbd) * 10) / 10;
      return { player, marginal };
    });

    scored.sort((a, b) => {
      // Primary: whoever raises my actual starting lineup the most.
      if (b.marginal !== a.marginal) return b.marginal - a.marginal;
      // Tie-break 1: urgency — a thinner tier means less chance he's still
      // there next round, so he's worth taking over an equally-valuable
      // player in a deep tier you can circle back for.
      if (a.player.tier !== b.player.tier) return a.player.tier - b.player.tier;
      if (a.player.tierSize !== b.player.tierSize) return a.player.tierSize - b.player.tierSize;
      // Tie-break 2 (mainly once a lineup's starters are all full and
      // marginal value bottoms out at 0 for most candidates): fall back to
      // raw value, so bench-round recommendations still make sense.
      return b.player.vbd - a.player.vbd;
    });

    return scored[0];
  }, [rows, drafted, posFilter, myRoster, baseStartingVbd, league, myStrength.rosterFull]);

  // Value-over-replacement is deliberately blind to "I have zero players at
  // a position I'm required to start" — that's a real gap pure VBD math
  // under-weights: a dedicated slot with nobody in it scores 0, not
  // whatever's left at that position, so a thin-but-positive remaining pool
  // there can lose a marginal-value comparison to a good bench stash
  // elsewhere even though punting the position is the bigger risk. This is
  // surfaced as its own signal alongside the VBD-based recommendation
  // (same pattern as Injury/SoS) rather than silently overriding it.
  const zeroRosteredPositions = useMemo(
    () =>
      (["QB", "RB", "WR", "TE"] as const).filter(
        (pos) => myStrength.openPositions.includes(pos) && myRoster.filter((r) => r.position === pos).length === 0
      ),
    [myStrength.openPositions, myRoster]
  );

  const urgencyLabel = (r: WarRoomRow) =>
    r.tierSize <= 1
      ? `alone in Tier ${r.tier} — high urgency`
      : `Tier ${r.tier} of ${r.tierSize} at ${r.position} — ${r.tierSize - 1} similar option${r.tierSize - 1 === 1 ? "" : "s"} left, safe to wait`;

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === -1 ? 1 : -1));
    } else {
      setSortKey(key);
      setSortDir(-1);
    }
  }

  const headers: { key: SortKey; label: string; title?: string }[] = [
    { key: "points", label: "Pts" },
    { key: "vbd", label: "VBD", title: "Value over this position's replacement level (last starter-quality player)" },
    { key: "cliff", label: "Δ Next", title: "Points lost to the next-best player at the same position — the cost of waiting one more pick" },
    {
      key: "tier",
      label: "Tier",
      title:
        "Gap-detected value tier at this position, not a fixed top-N split. A lonely tier (size 1) means passing on him costs real value — a big tier means plenty of similar options remain, so it's safe to draft elsewhere and come back.",
    },
    { key: "adp", label: "ADP" },
    {
      key: "delta",
      label: "Value vs ADP",
      title:
        "Where he's valued (rank by VBD) minus where the market drafts him (rank by ADP/search_rank). Positive = he typically falls past his true value, so you can wait on him. Negative = the market takes him earlier than his value rank, so he likely won't last if you wait.",
    },
    { key: "injury", label: "Injury" },
    { key: "sos", label: "SoS (Playoffs)" },
    { key: "composite", label: "Composite", title: "VBD adjusted for injury risk and playoff-week SoS" },
  ];

  return (
    <div className="space-y-3">
      {myTeam.size === 0 && drafted.size >= 5 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 sm:px-5">
          <span className="font-medium">{drafted.size} players are off the board, but none are tagged as yours.</span> My Team and the
          Recommended Pick below can&rsquo;t account for your actual roster until some picks are — add your Sleeper username under Sleeper
          Sync so a synced draft auto-tags them, or click <span className="font-medium text-fg">Mine</span> on your own picks as you make
          them.
        </div>
      )}
      {myStrength.rosterFull && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-800 dark:text-emerald-300 sm:px-5">
          <span className="font-medium">Your roster is full</span> — {myStrength.totalSlots} starters and {myStrength.benchCapacity} bench
          spots, all filled. Nothing left to recommend.
        </div>
      )}
      {recommended && zeroRosteredPositions.length > 0 && !zeroRosteredPositions.includes(recommended.player.position) && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-800 dark:text-amber-300 sm:px-5">
          <span className="font-medium">
            You have zero rostered {zeroRosteredPositions.join("/")} despite a required slot open there.
          </span>{" "}
          VBD-over-replacement doesn&rsquo;t know an empty required slot scores worse than any warm body — it just sees whatever&rsquo;s left
          at {zeroRosteredPositions.join("/")} losing the marginal-value comparison below. Worth checking that tab yourself before trusting
          this recommendation over it.
        </div>
      )}
      {recommended && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 sm:px-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              Recommended pick{posFilter !== "ALL" ? ` · ${posFilter}` : ""}
            </p>
            <p className="mt-0.5 text-sm font-medium text-fg">
              {recommended.player.name} <span className="text-muted">({recommended.player.position})</span> —{" "}
              {recommended.marginal > 0 ? (
                <>+{recommended.marginal.toFixed(1)} pts to your starting lineup</>
              ) : (
                <>{recommended.player.vbd.toFixed(1)} pts over replacement</>
              )}
            </p>
            <p className="mt-1 text-xs text-muted">
              {recommended.marginal > 0 ? (
                myRoster.length > 0 ? (
                  <>Your best available upgrade — raises your projected starting VBD from {baseStartingVbd.toFixed(1)} to {(baseStartingVbd + recommended.marginal).toFixed(1)}. </>
                ) : drafted.size === 0 ? (
                  <>Nothing drafted yet, so this is simply the top value on the board. </>
                ) : (
                  <>
                    {drafted.size} players are off the board, but none are tagged as yours yet, so this is just the top value on the board
                    — not adjusted for your actual roster.{" "}
                  </>
                )
              ) : (
                <>
                  Your starters are already ahead of him here — he&rsquo;d be bench value ({myStrength.benchOpen} of {myStrength.benchCapacity}{" "}
                  bench spot{myStrength.benchCapacity === 1 ? "" : "s"} still open), but still your best pick by raw VBD.{" "}
                </>
              )}
              {recommended.player.tierSize <= 1 ? (
                <>Alone in Tier {recommended.player.tier} at {recommended.player.position} — the next tier drops off, so don&rsquo;t wait on him.</>
              ) : (
                <>
                  Tier {recommended.player.tier} of {recommended.player.tierSize} similar {recommended.player.position}s — {recommended.player.tierSize - 1} more
                  within reach of this value.
                </>
              )}
              {recommended.player.valueDelta != null && recommended.player.valueDelta > 0 && (
                <>
                  {" "}
                  He&rsquo;s also going at ADP {recommended.player.adp ?? recommended.player.searchRank ?? "—"} while ranking #{recommended.player.vorpRank}{" "}
                  by value — a {recommended.player.valueDelta}-spot discount versus the market.
                </>
              )}
            </p>
          </div>
          <button
            type="button"
            onClick={() => onMarkMine(recommended.player.id)}
            className="shrink-0 text-xs font-medium text-accent hover:underline"
          >
            Draft him
          </button>
        </div>
      )}

      <div className="rounded-2xl border border-border bg-bg-elevated">
        <div className="flex flex-wrap items-center gap-3 border-b border-border p-4 sm:p-5">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search player or team…"
            className="h-9 min-w-[180px] flex-1 rounded-lg border border-border bg-bg px-3 text-sm text-fg outline-none focus-visible:border-accent"
          />
          <div className="flex items-center gap-1">
            {POSITION_FILTERS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPosFilter(p)}
                className={cn(
                  "h-9 rounded-full px-3 text-xs font-medium transition-colors",
                  posFilter === p ? "bg-fg text-bg" : "border border-border text-muted hover:text-fg"
                )}
              >
                {p}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={watchOnly} onChange={(e) => setWatchOnly(e.target.checked)} />
            Watchlist only
          </label>
          <label className="flex items-center gap-1.5 text-xs text-muted">
            <input type="checkbox" checked={hideDrafted} onChange={(e) => setHideDrafted(e.target.checked)} />
            Hide drafted
          </label>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs uppercase tracking-wide text-muted">
                <th className="w-10 px-3 py-2.5" />
                <th className="px-3 py-2.5">Player</th>
                <th className="px-3 py-2.5">Pos</th>
                {headers.map((h) => (
                  <th key={h.key} className="px-3 py-2.5" title={h.title}>
                    <button type="button" onClick={() => toggleSort(h.key)} className="inline-flex items-center gap-1 hover:text-fg">
                      {h.label}
                      <ArrowUpDown className="h-3 w-3" aria-hidden="true" />
                    </button>
                  </th>
                ))}
                <th className="px-3 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r, idx) => {
                const isMine = myTeam.has(r.id);
                const isDrafted = drafted.has(r.id);
                const isTakenByOther = isDrafted && !isMine;
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-bg-inset",
                      isTakenByOther && "opacity-40",
                      isMine && "bg-accent-soft/40"
                    )}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        type="button"
                        onClick={() => onToggleWatch(r.id)}
                        aria-label={watchlist.has(r.id) ? "Remove from watchlist" : "Add to watchlist"}
                        className="text-muted transition-colors hover:text-accent"
                      >
                        <Star className={cn("h-4 w-4", watchlist.has(r.id) && "fill-accent text-accent")} aria-hidden="true" />
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="w-5 shrink-0 font-mono text-[11px] text-muted">{idx + 1}</span>
                        <div>
                          <p className="font-medium text-fg">
                            {r.name} {isMine && <Badge tone="accent">Mine</Badge>}
                          </p>
                          <p className="text-[11px] text-muted">
                            {r.team ?? "FA"}
                            {r.rosteredBy && ` · ${r.rosteredBy}`}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5">
                      <Badge tone="accent">{r.position}</Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-fg">
                      {r.points.toFixed(1)}
                      {r.pointsBasis === "adp-estimate" && <span title="Estimated from ADP curve — no stat projection on file"> *</span>}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs font-medium text-fg">{r.vbd.toFixed(1)}</td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">{r.cliff > 0 ? `−${r.cliff.toFixed(1)}` : "—"}</td>
                    <td className="px-3 py-2.5" title={urgencyLabel(r)}>
                      <Badge tone={r.tierSize <= 1 ? "bad" : r.tierSize <= 3 ? "neutral" : "good"}>
                        T{r.tier} · {r.tierSize} deep
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">{r.adp ?? r.searchRank ?? "—"}</td>
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {r.valueDelta != null ? (
                        <span className={r.valueDelta > 0 ? "text-emerald-700 dark:text-emerald-400" : r.valueDelta < 0 ? "text-red-600 dark:text-red-400" : "text-muted"}>
                          {r.valueDelta > 0 ? "+" : ""}
                          {r.valueDelta}
                        </span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5" title={r.injury.factors.join("\n")}>
                      <Badge tone={INJURY_TONE[r.injury.tier]}>
                        {r.injury.tier} · {r.injury.score}
                      </Badge>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-muted">
                      {r.sos.playoffGrade != null ? (
                        <Badge tone={r.sos.playoffGrade >= 60 ? "good" : r.sos.playoffGrade <= 40 ? "bad" : "neutral"}>
                          {r.sos.playoffGrade.toFixed(0)}/100
                        </Badge>
                      ) : (
                        <span className="text-muted">Import data</span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-sm text-fg">{r.compositeValue.toFixed(1)}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center justify-end gap-1.5">
                        {isDrafted ? (
                          <button
                            type="button"
                            onClick={() => onUndoPick(r.id)}
                            className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-medium text-muted transition-colors hover:text-fg"
                          >
                            <Undo2 className="h-3 w-3" aria-hidden="true" /> Undo
                          </button>
                        ) : (
                          <>
                            <button
                              type="button"
                              onClick={() => onMarkMine(r.id)}
                              title="Draft to my team"
                              aria-label={`Mark ${r.name} as mine`}
                              className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-medium text-fg transition-colors hover:border-accent hover:text-accent"
                            >
                              <Shirt className="h-3 w-3" aria-hidden="true" /> Mine
                            </button>
                            <button
                              type="button"
                              onClick={() => onMarkTaken(r.id)}
                              title="Someone else drafted him"
                              aria-label={`Mark ${r.name} as taken`}
                              className="inline-flex h-7 items-center gap-1 rounded-full border border-border px-2.5 text-[11px] font-medium text-muted transition-colors hover:text-fg"
                            >
                              <X className="h-3 w-3" aria-hidden="true" /> Taken
                            </button>
                          </>
                        )}
                        <button
                          type="button"
                          onClick={() => onToggleExcluded(r.id)}
                          title="Exclude — wrong player, stale/retired, or bad data"
                          aria-label={`Exclude ${r.name}`}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted transition-colors hover:border-red-400 hover:text-red-600 dark:hover:text-red-400"
                        >
                          <Ban className="h-3 w-3" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={14} className="px-3 py-10 text-center text-sm text-muted">
                    No players match. Sync Sleeper or import a CSV from Data Sources above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {excludedPlayers.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-t border-border px-4 py-3 sm:px-5">
            <span className="text-xs text-muted">Excluded:</span>
            {excludedPlayers.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onToggleExcluded(p.id)}
                title="Restore to the board"
                className="inline-flex items-center gap-1 rounded-full bg-bg-inset px-2.5 py-1 text-xs text-muted transition-colors hover:text-fg"
              >
                {p.name} ({p.position})
                <Undo2 className="h-3 w-3" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
