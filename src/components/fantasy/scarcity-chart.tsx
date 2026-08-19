"use client";

import type { Position, ScarcityResult } from "@/lib/fantasy/types";
import { Card } from "./ui";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];
const POSITION_COLOR: Record<Position, string> = {
  QB: "var(--accent)",
  RB: "#4c8bf5",
  WR: "#37b679",
  TE: "#c2578a",
};

export function ScarcityChart({ scarcity, teams }: { scarcity: ScarcityResult; teams: number }) {
  const maxVbd = Math.max(1, ...scarcity.players.map((p) => p.vbd));

  return (
    <Card>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-display text-lg font-medium text-fg">Positional Scarcity (VBD)</h3>
        <p className="text-xs text-muted">Value above each position&rsquo;s simulated replacement level</p>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {POSITIONS.map((pos) => {
          const group = scarcity.players
            .filter((p) => p.position === pos)
            .sort((a, b) => b.points - a.points)
            .slice(0, 10);
          const color = POSITION_COLOR[pos];

          return (
            <div key={pos}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-xs uppercase tracking-wide text-fg">{pos}</span>
                <span className="text-[11px] text-muted">{scarcity.startersByPosition[pos]} startable</span>
              </div>
              <div className="mt-2 flex h-32 items-end gap-1" role="img" aria-label={`${pos} value-above-replacement, top 10`}>
                {group.map((p) => (
                  <div
                    key={p.id}
                    title={`${p.name} — VBD ${p.vbd.toFixed(1)}`}
                    className="flex-1 rounded-t-sm transition-opacity hover:opacity-80"
                    style={{
                      height: `${Math.max((Math.max(p.vbd, 0) / maxVbd) * 100, 3)}%`,
                      background: color,
                      opacity: 0.55 + 0.45 * (1 - (p.tier - 1) / 4),
                    }}
                  />
                ))}
                {group.length === 0 && <p className="self-center text-xs text-muted">No players synced</p>}
              </div>
              <p className="mt-1.5 text-[11px] text-muted">
                Replacement level: {scarcity.replacementLevel[pos].toFixed(0)} pts &middot; {teams}-team
              </p>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
