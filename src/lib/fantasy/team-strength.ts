/**
 * Team strength — takes whatever's on your roster so far and finds the
 * value-maximizing starting lineup for it, using the same greedy
 * dedicated-slot -> FLEX -> SUPERFLEX priority as the league-wide scarcity
 * simulation in scarcity.ts, just scoped to one team's own slot counts
 * instead of teams x slots.
 *
 * This is what turns "draft the best player available" into "draft the
 * player who most improves my actual starting lineup" — two RBs you've
 * already started don't need a third at the same value a still-empty
 * TE slot would.
 */

import { SLOT_ELIGIBILITY } from "./types";
import type { LeagueSettings, Position, SlotType, TeamSlotAssignment, TeamStrength, WarRoomRow } from "./types";

const SLOT_ORDER: SlotType[] = ["QB", "RB", "WR", "TE", "FLEX", "SUPER_FLEX"];

export function computeTeamStrength(myRoster: WarRoomRow[], league: LeagueSettings): TeamStrength {
  const openSlots: Record<SlotType, number> = {
    QB: league.roster.QB,
    RB: league.roster.RB,
    WR: league.roster.WR,
    TE: league.roster.TE,
    FLEX: league.roster.FLEX,
    SUPER_FLEX: league.roster.SUPER_FLEX,
  };
  const totalSlots = Object.values(openSlots).reduce((a, b) => a + b, 0);

  const priorityFor = (pos: Position): SlotType[] => {
    const slots: SlotType[] = [pos];
    if (SLOT_ELIGIBILITY.FLEX.includes(pos)) slots.push("FLEX");
    if (SLOT_ELIGIBILITY.SUPER_FLEX.includes(pos)) slots.push("SUPER_FLEX");
    return slots;
  };

  const sorted = [...myRoster].sort((a, b) => b.points - a.points);
  const filledBySlot: Record<SlotType, WarRoomRow[]> = { QB: [], RB: [], WR: [], TE: [], FLEX: [], SUPER_FLEX: [] };
  const bench: WarRoomRow[] = [];

  for (const p of sorted) {
    let placed = false;
    for (const slot of priorityFor(p.position)) {
      if (openSlots[slot] > 0) {
        openSlots[slot] -= 1;
        filledBySlot[slot].push(p);
        placed = true;
        break;
      }
    }
    if (!placed) bench.push(p);
  }

  const assignments: TeamSlotAssignment[] = [];
  for (const slot of SLOT_ORDER) {
    const filled = filledBySlot[slot];
    const capacity = league.roster[slot];
    for (let i = 0; i < capacity; i++) {
      assignments.push({ slot, player: filled[i] ?? null });
    }
  }

  const startingPoints = assignments.reduce((sum, a) => sum + (a.player?.points ?? 0), 0);
  const startingVbd = assignments.reduce((sum, a) => sum + (a.player?.vbd ?? 0), 0);
  const filledSlots = assignments.filter((a) => a.player != null).length;

  // Only dedicated slots (QB/RB/WR/TE) name a concrete need — an empty
  // FLEX/SUPERFLEX is ambiguous by design, so it's shown in the lineup
  // itself rather than listed as "need X."
  const openPositions: Position[] = assignments
    .filter((a) => a.player == null && SLOT_ELIGIBILITY[a.slot].length === 1)
    .map((a) => SLOT_ELIGIBILITY[a.slot][0]);

  return {
    assignments,
    startingPoints: Math.round(startingPoints * 10) / 10,
    startingVbd: Math.round(startingVbd * 10) / 10,
    bench,
    filledSlots,
    totalSlots,
    openPositions,
  };
}
