/**
 * Positional scarcity engine.
 *
 * Simulates how a league's actual roster construction (dedicated slots +
 * FLEX + SUPER_FLEX) consumes the player pool, to find each position's
 * *replacement level* dynamically — rather than assuming a fixed "top 12
 * QBs start" rule that falls apart the moment a league runs superflex.
 *
 * Algorithm (greedy, value-ordered):
 *   Walk all rostered-eligible players in points order. Each player fills
 *   the highest-priority open slot he's eligible for: his own dedicated
 *   slot first, then FLEX, then SUPER_FLEX. Once a position's dedicated +
 *   flex + superflex slots are exhausted league-wide, further players at
 *   that position are "replacement level" (bench/streamers).
 *
 * This is what actually makes superflex raise QB value: QBs are eligible
 * for SUPER_FLEX, and since the 13th-24th best QBs usually out-point the
 * 13th-24th best RB/WR, they win almost all of the SUPER_FLEX slots —
 * which the simulation discovers on its own rather than being told to.
 */

import { SLOT_ELIGIBILITY, type LeagueSettings, type Position, type ScarcityResult, type SlotType, type ValuedPlayer } from "./types";

const POSITIONS: Position[] = ["QB", "RB", "WR", "TE"];

export function computeScarcity(players: ValuedPlayer[], league: LeagueSettings): ScarcityResult {
  const sorted = [...players].sort((a, b) => b.points - a.points);

  const openSlots: Record<SlotType, number> = {
    QB: league.teams * league.roster.QB,
    RB: league.teams * league.roster.RB,
    WR: league.teams * league.roster.WR,
    TE: league.teams * league.roster.TE,
    FLEX: league.teams * league.roster.FLEX,
    SUPER_FLEX: league.teams * league.roster.SUPER_FLEX,
  };

  const startersByPosition: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const startedIds = new Set<string>();

  // Priority order for each position: its own dedicated slot, then FLEX
  // (if eligible), then SUPER_FLEX (if eligible).
  const priorityFor = (pos: Position): SlotType[] => {
    const slots: SlotType[] = [pos];
    if (SLOT_ELIGIBILITY.FLEX.includes(pos)) slots.push("FLEX");
    if (SLOT_ELIGIBILITY.SUPER_FLEX.includes(pos)) slots.push("SUPER_FLEX");
    return slots;
  };

  for (const p of sorted) {
    for (const slot of priorityFor(p.position)) {
      if (openSlots[slot] > 0) {
        openSlots[slot] -= 1;
        startersByPosition[p.position] += 1;
        startedIds.add(p.id);
        break;
      }
    }
    const allFull = Object.values(openSlots).every((n) => n === 0);
    if (allFull) break;
  }

  // Replacement level = points of the first player at each position who
  // did NOT start (or, if the pool is thinner than the starter count, the
  // last player available).
  const replacementLevel: Record<Position, number> = { QB: 0, RB: 0, WR: 0, TE: 0 };
  const byPosition = new Map<Position, ValuedPlayer[]>();
  for (const pos of POSITIONS) {
    byPosition.set(
      pos,
      sorted.filter((p) => p.position === pos)
    );
  }
  for (const pos of POSITIONS) {
    const group = byPosition.get(pos)!;
    const idx = Math.min(startersByPosition[pos], Math.max(group.length - 1, 0));
    replacementLevel[pos] = group.length > 0 ? group[idx]?.points ?? group[group.length - 1].points : 0;
  }

  // VBD and local cliff (points lost to the very next player at the same
  // position) first.
  const withVbd = sorted.map((p) => ({
    ...p,
    vbd: Math.round((p.points - replacementLevel[p.position]) * 10) / 10,
    cliff: 0,
    tier: 1,
    tierSize: 1,
  }));

  // Tiers are detected from real gaps in the value curve, not an arbitrary
  // top-N split — this is the piece that actually answers "if I pass on
  // this guy, is there a similar one left, or does the position fall off a
  // cliff?" A position that's top-heavy (one clear QB1, then a plateau)
  // gets a lonely tier 1 and a big tier 2; a position that declines evenly
  // gets many small tiers. A gap only starts a new tier once it's at least
  // TIER_GAP_FRACTION of that position's whole VBD range, so noise in the
  // middle of the pack doesn't fragment it into dozens of one-man tiers.
  const TIER_GAP_FRACTION = 0.12;

  for (const pos of POSITIONS) {
    const group = withVbd.filter((p) => p.position === pos).sort((a, b) => b.points - a.points);
    group.forEach((p, idx) => {
      const next = group[idx + 1];
      p.cliff = next ? Math.round((p.points - next.points) * 10) / 10 : 0;
    });

    const range = Math.max((group[0]?.points ?? 0) - replacementLevel[pos], 1);
    const gapThreshold = range * TIER_GAP_FRACTION;
    let tier = 1;
    group.forEach((p, idx) => {
      if (idx > 0 && group[idx - 1].points - p.points >= gapThreshold) tier += 1;
      p.tier = tier;
    });
    const tierCounts = new Map<number, number>();
    for (const p of group) tierCounts.set(p.tier, (tierCounts.get(p.tier) ?? 0) + 1);
    for (const p of group) p.tierSize = tierCounts.get(p.tier) ?? 1;
  }

  return {
    replacementLevel,
    startersByPosition,
    players: withVbd,
  };
}
