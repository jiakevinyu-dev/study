import { Card } from "./ui";

const ITEMS = [
  {
    title: "Points",
    body:
      "If a player has an imported stat-line projection, points are the exact dot product of that stat line with your current scoring settings — change PPR value, TE premium, or any weight and every player's points update immediately. Without a projection, points are estimated from ADP/Sleeper rank via a position-specific decay curve (marked with * in the table) — a shape approximation for sorting, not a projection.",
  },
  {
    title: "Positional scarcity (VBD) — the default sort",
    body:
      "A greedy, value-ordered simulation fills your league's actual roster slots — dedicated QB/RB/WR/TE, then FLEX, then SUPERFLEX — across all teams. Whatever's left at each position once its slots run dry sets that position's replacement level. Value above that level (VBD) is what makes superflex correctly inflate QB value: QBs win most SUPERFLEX slots because the 13th-24th best QB usually outscores the equivalent RB/WR, and the simulation finds that on its own. The board sorts by VBD by default — pure value-over-replacement, not risk-adjusted — because that's the number to draft off of. The Δ Next column next to it shows the cost of waiting: points lost to the next-best player at that same position, i.e. what you give up if he's gone by your next pick.",
  },
  {
    title: "Tiers — the opportunity-cost check VBD alone misses",
    body:
      "VBD only compares a player to the worst startable player at his position — it doesn't say whether there's a near-twin of him sitting three picks later. Tiers do: at each position, players are clustered by real gaps in the value curve (a gap only starts a new tier once it's at least 12% of that position's VBD range), so a top-heavy position naturally gets a lonely Tier 1 and a big Tier 2, while a position that declines evenly gets many small tiers. Worked example: a locked-in TE1 sitting alone in Tier 1 with six comparable TEs bunched in Tier 2 a few points back shows up as 'T1 · 1 deep' — spending an early pick there costs you a scarcer position's Tier 1 for a TE edge you could've had two rounds later. The Tier column and the chart's bar gaps show this at every position; the Best Available banner calls out the tier context for whoever's on top.",
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
      "VBD, discounted by injury risk and nudged by playoff-week SoS when that data exists. It's a separate, optional column — click it if you want risk baked in — but it never overrides VBD as the default sort.",
  },
  {
    title: "Mock & live draft sync",
    body:
      "Paste a Sleeper draft ID or mock-draft URL under Sleeper Sync: every player already picked is marked drafted and gets his pick number as ADP, so the board reflects that specific draft instead of a generic ranking. Hit Refresh picks as the draft progresses.",
  },
  {
    title: "Bad data? Exclude it",
    body:
      "Sleeper's player list keeps long-retired players on file indefinitely and doesn't always clear a stale team — this tool now requires Sleeper's active flag before a player is shown, but if anything wrong still slips through, hit the ⊘ next to any row to pull him out of the pool entirely (recomputes replacement levels without him). Excluded players are listed at the bottom of the table with one click to restore.",
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
