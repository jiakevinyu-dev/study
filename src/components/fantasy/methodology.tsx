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
      "VBD only compares a player to the worst startable player at his position — it doesn't say whether there's a near-twin of him sitting three picks later. Tiers do: at each position, players are clustered by real gaps in the value curve (a gap only starts a new tier once it's at least 12% of that position's VBD range), so a top-heavy position naturally gets a lonely Tier 1 and a big Tier 2, while a position that declines evenly gets many small tiers. Worked example: a locked-in TE1 sitting alone in Tier 1 with six comparable TEs bunched in Tier 2 a few points back shows up as 'T1 · 1 deep' — spending an early pick there costs you a scarcer position's Tier 1 for a TE edge you could've had two rounds later. The Tier column and the chart's bar gaps show this at every position; the Recommended Pick banner calls out the tier context for whoever's on top.",
  },
  {
    title: "Value vs ADP — who you can wait on",
    body:
      "Two overall ranks, compared: vorpRank (where a player ranks by VBD, across all positions) and marketRank (where the market actually drafts him — real ADP if you've imported it, otherwise Sleeper's search_rank; Sleeper doesn't expose a true consensus-ADP endpoint, so search_rank is the closest live signal available). Value vs ADP = marketRank − vorpRank. A big positive number means he's typically gone well after his true value rank — the Derrick-Henry pattern: elite value, but the market lets him fall, so you can prioritize a scarcer position now and still get him later. A negative number means the market drafts him ahead of his value rank — he won't last if you're counting on grabbing him late, so either take him now or plan around not getting him. For the most defensible comparison, import real ADP (Underdog/FantasyPros/your own draft's pick order via Sleeper draft sync) rather than relying on search_rank alone.",
  },
  {
    title: "My Team & Team Strength",
    body:
      "Hit Mine on a player to add him to your roster; Taken marks him off the board without claiming him. The My Team panel then runs the same slot-filling logic as the league-wide scarcity simulation — dedicated slot, then FLEX, then SUPERFLEX — scoped to just your own roster, to find your value-maximizing starting lineup and its total projected points and VBD. That's what turns 'draft the best player available' into 'draft the player who most improves my actual lineup': two RBs you've already started don't need a third at the value an empty TE slot would unlock. Bench slots (your league's real BENCH count, not a guess) cap the roster too — once every starting slot and every bench spot is filled, the panel and the Recommended Pick banner both know there's nothing left to add. Syncing a Sleeper draft with your username auto-tags your own picks as Mine; otherwise just click it yourself as you draft.",
  },
  {
    title: "Recommended Pick — who actually helps your team right now",
    body:
      "Every undrafted player is run through the same starting-lineup simulation as My Team & Team Strength, as if you'd just drafted him — the top of the list is whoever raises your projected starting VBD the most, not just whoever has the highest raw VBD. A great QB when your QB and SUPERFLEX slots are both already started adds ~0 marginal value and loses to a merely-good player filling your empty TE slot. The panel shows your top 5, not just #1, each with its own marginal value and (once a draft's synced with your username) scarcity drop-off — see the next item. Ties (common once your starters are full) go first to whoever's in the thinner tier, then to raw VBD, so late-round bench recommendations still make sense. Before you've drafted anyone, the top pick is identical to picking the top VBD player, so it's a strict upgrade, not a different mode. When the market's letting the pick fall well past his value rank, that ADP discount is called out too — the concrete case of 'draft the guy whose ADP undersells him.' One thing this math genuinely doesn't know: an empty *required* slot scores zero, worse than any warm body would — so if you've got zero players at a position you must start, a separate warning banner flags that explicitly rather than letting the recommendation silently imply everything's fine. It also doesn't know a redraft roster simply won't carry a 3rd TE regardless of how good his numbers look filling an empty FLEX today — that's what position caps (below) are for.",
  },
  {
    title: "Position caps — you're never actually drafting a 3rd TE",
    body:
      "League Settings has a max roster spots per position (TE defaults to 2; QB/RB/WR are uncapped by default). Once you've hit a cap, that position stops appearing in the Recommended Pick list entirely — not deprioritized, excluded — because marginal value and scarcity drop-off only ever know 'this player has some value somewhere,' never 'my roster will never actually carry a 4th one of these regardless.' This is also the mechanism behind 'a deep position's 2nd guy should come late': with TE capped at 2 and one already rostered, the model only ever recommends TE2 when he's genuinely your best remaining marginal value at any position — which, because TE runs deep, tends not to happen until the shallower positions have thinned out. The full table and Mine/Taken still work normally past a cap; it only affects what's recommended for you.",
  },
  {
    title: "Scarcity drop-off — will he actually be there next round?",
    body:
      "Sync a mock/live draft with your username and the tool knows exactly where you sit in the snake order — from that it works out precisely how many other teams pick before your turn comes back around, not a guess. It then estimates, from the current market-rank order of everyone left, roughly who'll be gone by then, and shows how many points the best same-position player *likely to survive* that window falls short of the player available right now. A position about to crater before your next pick scores a real bonus over one the market will still be offering an equally good version of later — even at equal marginal value today. Each recommended player also gets a plain-English survival read (Likely gone / Could go either way / Likely still there) from the same estimate — a simulation off real ADP order, not a claimed probability. The Scarcity weight slider controls how much this shifts the ranking relative to marginal team value (0 ignores it entirely); both numbers are always shown separately so the reasoning stays visible, never a black box. Without a synced draft position, the list still works — it just can't see your specific pick window, and says so.",
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
      "Sync a real league (by username or league ID) and its draft is found automatically — no separate draft ID to go dig up — and pre-filled below; add your username and hit Sync draft. A mock draft still needs its ID or URL pasted directly, since mocks aren't tied to a league. Either way: every player already picked is marked drafted and gets his pick number as ADP — real, observed order from that specific draft, the most accurate ADP signal there is, well ahead of a generic ranking. Your username also resolves your exact snake-draft slot (powers the scarcity drop-off above) and polls on its own every few seconds while the draft is live, auto-tagging your picks as Mine and everyone else's as Taken — no manual clicking, and the connection survives a refresh so it keeps polling even if you close the tab and come back. Hit Refresh now if you want to force an update, or Stop syncing to disconnect.",
  },
  {
    title: "Bad data? Exclude it — or set a relevance cutoff",
    body:
      "Sleeper's player list keeps long-retired players on file indefinitely and doesn't always clear a stale team — this tool now requires Sleeper's active flag before a player is shown, but if anything wrong still slips through, hit the ⊘ next to any row to pull him out of the pool entirely (recomputes replacement levels without him). Excluded players are listed at the bottom of the table with one click to restore. Separately, League Settings has a relevance cutoff (default: ADP/search_rank worse than 300) that drops the deep, practice-squad-tier tail of Sleeper's full player dump from the board outright — it doesn't just declutter the table, it keeps that long tail from skewing tiers and replacement levels for real starter-quality players. Anyone already on your roster or off the board stays visible regardless of the cutoff; clear the field to show everyone.",
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
