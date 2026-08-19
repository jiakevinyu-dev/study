import type { WarRoomRow } from "@/lib/fantasy/types";
import { Card } from "./ui";

export function StatCards({ rows, playerCount }: { rows: WarRoomRow[]; playerCount: number }) {
  const top = rows[0];
  const biggestCliff = [...rows].sort((a, b) => b.cliff - a.cliff)[0];
  const highRisk = rows.filter((r) => r.injury.tier === "High" || r.injury.tier === "Elevated").length;

  const stats = [
    { label: "Players in pool", value: playerCount > 0 ? playerCount.toLocaleString() : "—" },
    { label: "Top composite value", value: top ? `${top.name} (${top.position})` : "—" },
    {
      label: "Draft-now cliff",
      value: biggestCliff && biggestCliff.cliff > 0 ? `${biggestCliff.name} · −${biggestCliff.cliff.toFixed(1)} pts next` : "—",
    },
    { label: "Elevated+ injury risk", value: playerCount > 0 ? `${highRisk} players` : "—" },
  ];

  return (
    <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
      {stats.map((s) => (
        <Card key={s.label} className="p-4 sm:p-5">
          <p className="truncate font-display text-lg font-medium text-fg" title={s.value}>
            {s.value}
          </p>
          <p className="mt-1 text-xs text-muted">{s.label}</p>
        </Card>
      ))}
    </div>
  );
}
