"use client";

import { computeTeamStrength } from "@/lib/fantasy/team-strength";
import type { LeagueSettings, WarRoomRow } from "@/lib/fantasy/types";
import { Badge, Card } from "./ui";

export function MyTeamPanel({ rows, myTeam, league }: { rows: WarRoomRow[]; myTeam: Set<string>; league: LeagueSettings }) {
  const myRoster = rows.filter((r) => myTeam.has(r.id));
  const strength = computeTeamStrength(myRoster, league);
  const needs = [...new Set(strength.openPositions)];

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-medium text-fg">My Team</h3>
        <Badge tone={myRoster.length > 0 ? "accent" : "neutral"}>
          {strength.filledSlots}/{strength.totalSlots} starters
        </Badge>
      </div>

      {myRoster.length === 0 ? (
        <p className="mt-3 text-sm text-muted">
          Hit <span className="font-medium text-fg">Mine</span> on players in the table as you draft them — this
          fills in with your optimal starting lineup and total team strength, live.
        </p>
      ) : (
        <>
          <div className="mt-4 grid grid-cols-2 gap-4 border-b border-border pb-5">
            <div>
              <p className="font-display text-2xl font-medium text-fg">{strength.startingPoints.toFixed(1)}</p>
              <p className="text-xs text-muted">Projected starting points</p>
            </div>
            <div>
              <p className="font-display text-2xl font-medium text-fg">{strength.startingVbd.toFixed(1)}</p>
              <p className="text-xs text-muted">Value over a replacement-level team</p>
            </div>
          </div>

          <div className="mt-4 space-y-1.5">
            {strength.assignments.map((a, idx) => (
              <div key={`${a.slot}-${idx}`} className="flex items-center gap-2 rounded-lg bg-bg-inset px-3 py-2 text-sm">
                <span className="w-24 shrink-0 font-mono text-[11px] uppercase tracking-wide text-muted">
                  {a.slot.replace("_", " ")}
                </span>
                {a.player ? (
                  <>
                    <span className="flex-1 truncate text-fg">{a.player.name}</span>
                    <span className="shrink-0 font-mono text-xs text-muted">{a.player.points.toFixed(1)} pts</span>
                  </>
                ) : (
                  <span className="flex-1 text-muted">— empty —</span>
                )}
              </div>
            ))}
          </div>

          {needs.length > 0 && <p className="mt-3 text-xs text-muted">Still need: {needs.join(", ")}</p>}

          {strength.bench.length > 0 && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="font-mono text-[11px] uppercase tracking-wide text-muted">Bench ({strength.bench.length})</p>
              <p className="mt-1.5 text-xs leading-relaxed text-muted">{strength.bench.map((p) => `${p.name} (${p.position})`).join(" · ")}</p>
            </div>
          )}
        </>
      )}
    </Card>
  );
}
