import { Card } from "./ui";

const ITEMS = [
  {
    title: "Points",
    body:
      "If a player has an imported stat-line projection, points are the exact dot product of that stat line with your current scoring settings — change PPR value, TE premium, or any weight and every player's points update immediately. Without a projection, points are estimated from ADP/Sleeper rank via a position-specific decay curve (marked with * in the table) — a shape approximation for sorting, not a projection.",
  },
  {
    title: "Positional scarcity (VBD)",
    body:
      "A greedy, value-ordered simulation fills your league's actual roster slots — dedicated QB/RB/WR/TE, then FLEX, then SUPERFLEX — across all teams. Whatever's left at each position once its slots run dry sets that position's replacement level. Value above that level (VBD) is what makes superflex correctly inflate QB value: QBs win most SUPERFLEX slots because the 13th-24th best QB usually outscores the equivalent RB/WR, and the simulation finds that on its own.",
  },
  {
    title: "Injury risk",
    body:
      "A transparent 0-100 heuristic, not a medical prediction: current Sleeper injury designation, a position/age decline curve, a position base rate for workload and contact exposure, and — if imported — recent games missed. Hover any Injury badge to see exactly which factors contributed.",
  },
  {
    title: "Strength of schedule",
    body:
      "Computed only from schedule and defense-vs-position data you sync or import — nothing is shipped pre-loaded. Full-season and fantasy-playoff-week grades (0-100, higher = easier) are the rescaled average of opponent defense-vs-position rank across a player's games.",
  },
  {
    title: "Composite value",
    body:
      "VBD, discounted by injury risk and nudged by playoff-week SoS when that data exists. This is what the board sorts by default — but every underlying metric is its own sortable column, so you can weight what matters to you at the table instead of trusting one number blindly.",
  },
];

export function Methodology() {
  return (
    <Card>
      <h3 className="font-display text-lg font-medium text-fg">Methodology &amp; Data Sources</h3>
      <dl className="mt-4 space-y-4">
        {ITEMS.map((item) => (
          <div key={item.title}>
            <dt className="font-mono text-xs uppercase tracking-wide text-accent">{item.title}</dt>
            <dd className="mt-1 text-sm leading-relaxed text-muted">{item.body}</dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}
