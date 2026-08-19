"use client";

import { useMemo, useState } from "react";
import { ArrowUpDown, Ban, Check, Star, Undo2 } from "lucide-react";
import type { Player, Position, WarRoomRow } from "@/lib/fantasy/types";
import { cn } from "@/lib/utils";
import { Badge } from "./ui";

type SortKey = "composite" | "vbd" | "cliff" | "points" | "adp" | "injury" | "sos";

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
  excludedPlayers: Player[];
  onToggleWatch: (id: string) => void;
  onToggleDrafted: (id: string) => void;
  onToggleExcluded: (id: string) => void;
};

export function RankingsTable({ rows, watchlist, drafted, excludedPlayers, onToggleWatch, onToggleDrafted, onToggleExcluded }: Props) {
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
      case "points":
        return r.points;
      case "adp":
        return -(r.adp ?? r.searchRank ?? 9999);
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

  // Best-available-by-VBD is always computed independent of the visible
  // sort/filter (position filter aside) so the banner is a stable draft
  // recommendation, not just "whatever's on top of the table right now."
  const bestAvailable = useMemo(() => {
    let pool = rows.filter((r) => !drafted.has(r.id));
    if (posFilter !== "ALL") pool = pool.filter((r) => r.position === posFilter);
    return [...pool].sort((a, b) => b.vbd - a.vbd)[0] ?? null;
  }, [rows, drafted, posFilter]);

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
    { key: "adp", label: "ADP" },
    { key: "injury", label: "Injury" },
    { key: "sos", label: "SoS (Playoffs)" },
    { key: "composite", label: "Composite", title: "VBD adjusted for injury risk and playoff-week SoS" },
  ];

  return (
    <div className="space-y-3">
      {bestAvailable && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent-soft px-4 py-3 sm:px-5">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wide text-accent">
              Best available by VBD{posFilter !== "ALL" ? ` · ${posFilter}` : ""}
            </p>
            <p className="mt-0.5 text-sm font-medium text-fg">
              {bestAvailable.name} <span className="text-muted">({bestAvailable.position})</span> — {bestAvailable.vbd.toFixed(1)} pts over
              replacement
              {bestAvailable.cliff > 0 && (
                <span className="text-muted"> · {bestAvailable.cliff.toFixed(1)} pts more than the next-best {bestAvailable.position}</span>
              )}
            </p>
          </div>
          <button type="button" onClick={() => onToggleDrafted(bestAvailable.id)} className="shrink-0 text-xs font-medium text-accent hover:underline">
            Mark drafted
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
          <table className="w-full min-w-[920px] text-left text-sm">
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
                const isDrafted = drafted.has(r.id);
                return (
                  <tr
                    key={r.id}
                    className={cn(
                      "border-b border-border/60 transition-colors hover:bg-bg-inset",
                      isDrafted && "opacity-40"
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
                          <p className="font-medium text-fg">{r.name}</p>
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
                    <td className="px-3 py-2.5 font-mono text-xs text-muted">{r.adp ?? r.searchRank ?? "—"}</td>
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
                        <button
                          type="button"
                          onClick={() => onToggleDrafted(r.id)}
                          className={cn(
                            "inline-flex h-7 items-center gap-1 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                            isDrafted ? "border-border text-muted hover:text-fg" : "border-border text-fg hover:border-border-strong"
                          )}
                        >
                          {isDrafted ? (
                            <>
                              <Undo2 className="h-3 w-3" aria-hidden="true" /> Undo
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" aria-hidden="true" /> Draft
                            </>
                          )}
                        </button>
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
                  <td colSpan={12} className="px-3 py-10 text-center text-sm text-muted">
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
