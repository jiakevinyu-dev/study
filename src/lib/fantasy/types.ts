/**
 * Core domain types for the Fantasy Football Redraft War Room.
 *
 * Nothing in this module hits the network or the DOM — it's the shared
 * vocabulary that the Sleeper client, the scoring/scarcity/injury/SoS
 * engines, and the UI all speak.
 */

export type Position = "QB" | "RB" | "WR" | "TE";

/** Roster slot types a league can start players in. */
export type SlotType = "QB" | "RB" | "WR" | "TE" | "FLEX" | "SUPER_FLEX";

/** Which real positions can fill a given slot. */
export const SLOT_ELIGIBILITY: Record<SlotType, Position[]> = {
  QB: ["QB"],
  RB: ["RB"],
  WR: ["WR"],
  TE: ["TE"],
  FLEX: ["RB", "WR", "TE"],
  SUPER_FLEX: ["QB", "RB", "WR", "TE"],
};

/**
 * Points-per-stat scoring settings. Defaults model a standard 12-team
 * PPR, no-TE-premium league (teRecBonus: 0). Every field is user-editable
 * in the settings panel, and every player's fantasy points are recomputed
 * live from these — nothing is pre-baked.
 */
export type ScoringSettings = {
  passYd: number;
  passTd: number;
  passInt: number;
  pass2pt: number;
  rushYd: number;
  rushTd: number;
  rush2pt: number;
  rec: number;
  recYd: number;
  recTd: number;
  /** Extra points per TE reception. Standard / no-TE-premium = 0. */
  teRecBonus: number;
  rec2pt: number;
  fumbleLost: number;
};

export const DEFAULT_SCORING: ScoringSettings = {
  passYd: 0.04, // 1 pt / 25 yds
  passTd: 4,
  passInt: -2,
  pass2pt: 2,
  rushYd: 0.1, // 1 pt / 10 yds
  rushTd: 6,
  rush2pt: 2,
  rec: 1, // full PPR
  recYd: 0.1,
  recTd: 6,
  teRecBonus: 0, // no TE premium
  rec2pt: 2,
  fumbleLost: -2,
};

/** How many of each slot type each team starts. */
export type RosterSlots = {
  QB: number;
  RB: number;
  WR: number;
  TE: number;
  FLEX: number;
  SUPER_FLEX: number;
  BENCH: number;
};

export const DEFAULT_ROSTER: RosterSlots = {
  QB: 1,
  RB: 2,
  WR: 2,
  TE: 1,
  FLEX: 1,
  SUPER_FLEX: 1,
  BENCH: 6,
};

export type LeagueSettings = {
  teams: number;
  scoring: ScoringSettings;
  roster: RosterSlots;
  /** Fantasy playoff weeks, used to weight SoS toward the games that matter. */
  playoffWeeks: number[];
  leagueName?: string;
  /** Present once settings were pulled from a real Sleeper league. */
  sleeperLeagueId?: string;
  /**
   * Players ranked worse than this by ADP (or search_rank, when no real ADP
   * is on file) are dropped from the board entirely — Sleeper's full player
   * dump includes thousands of practice-squad/inactive-depth-chart names no
   * redraft league will ever start, and their long, near-flat tail was
   * what made a single true standout at a position get merged into a
   * "Tier 1" alongside hundreds of irrelevant players. Also the practical
   * backstop against stale/misflagged data (e.g. a long-retired player
   * Sleeper's `active` flag didn't catch) — nobody real drafts a player
   * outside the top few hundred by ADP, whatever his profile says. Null
   * disables the cutoff (show everyone).
   */
  poolRelevanceCutoff: number | null;
  /**
   * Realistic ceiling on how many players at a position you'd ever actually
   * roster — e.g. TE: 2, QB: 2 in most leagues (even superflex, where the 2
   * combined QB-eligible slots are exactly what 2 QBs covers), since a 3rd
   * at either is never worth a pick over depth at RB/WR, which fill nearly
   * every remaining slot in a well-built lineup. Unset = no cap. This is a
   * hard exclusion from the recommendation list once hit, not a soft nudge:
   * the marginal-value/scarcity math alone doesn't know "we'll never
   * actually roster more than N of these," only "this one has some value"
   * — which, left unconstrained, undervalues just how replaceable a deep
   * position's 3rd-string options are relative to literally anything at a
   * scarcer spot.
   */
  positionCaps: Partial<Record<Position, number>>;
};

export const DEFAULT_LEAGUE: LeagueSettings = {
  teams: 12,
  scoring: DEFAULT_SCORING,
  roster: DEFAULT_ROSTER,
  playoffWeeks: [15, 16, 17],
  leagueName: "12-Team Superflex PPR (No TE Premium)",
  poolRelevanceCutoff: 250,
  positionCaps: { QB: 2, TE: 2 },
};

/** Raw counting-stat projection for a season, used to derive fantasy points. */
export type StatProjection = {
  passYd?: number;
  passTd?: number;
  passInt?: number;
  pass2pt?: number;
  rushYd?: number;
  rushTd?: number;
  rush2pt?: number;
  rec?: number;
  recYd?: number;
  recTd?: number;
  rec2pt?: number;
  fumbleLost?: number;
  gamesMissedLastSeason?: number;
};

export type InjuryStatus = "Healthy" | "Questionable" | "Doubtful" | "Out" | "IR" | "PUP" | "Suspended";

export type PlayerSource = "sleeper" | "csv" | "manual";

export type Player = {
  id: string;
  name: string;
  position: Position;
  team: string | null;
  age: number | null;
  yearsExp: number | null;
  injuryStatus: InjuryStatus;
  injuryBodyPart: string | null;
  depthChartOrder: number | null;
  /** Sleeper's internal consensus rank (lower = better), used as an ADP proxy. */
  searchRank: number | null;
  /** Overall ADP if synced/imported from a real source (lower = better). */
  adp: number | null;
  /** Raw stat-line projection, when available — enables full scoring dynamism. */
  projStats: StatProjection | null;
  source: PlayerSource;
  rosteredBy: string | null;
};

export type ScheduleEntry = {
  team: string;
  week: number;
  opponent: string | "BYE";
  homeAway: "home" | "away" | null;
};

/** Defense-vs-position strength. rank 1 = toughest matchup, 32 = easiest. */
export type DefenseRating = {
  team: string;
  position: Position;
  rankVsPosition: number;
};

export type ValuedPlayer = Player & {
  /** Fantasy points for the season under the current league scoring. */
  points: number;
  /** Whether points came from a real stat projection or an ADP-decay estimate. */
  pointsBasis: "projection" | "adp-estimate";
  positionRank: number;
};

export type ScarcityResult = {
  replacementLevel: Record<Position, number>;
  startersByPosition: Record<Position, number>;
  players: (ValuedPlayer & {
    vbd: number;
    /** Local steepness of the value curve just below this player, at his position. */
    cliff: number;
    /** Gap-detected value tier at this position — 1 is the top tier. Not a fixed top-N split. */
    tier: number;
    /** How many players (including this one) share this tier at this position. */
    tierSize: number;
  })[];
};

export type InjuryRisk = {
  score: number; // 0-100, higher = riskier
  tier: "Low" | "Moderate" | "Elevated" | "High";
  factors: string[];
};

export type SosResult = {
  fullSeasonGrade: number | null; // 0-100, higher = easier schedule
  playoffGrade: number | null;
  gamesFound: number;
  playoffGamesFound: number;
};

export type WarRoomRow = ValuedPlayer & {
  vbd: number;
  cliff: number;
  tier: number;
  tierSize: number;
  injury: InjuryRisk;
  sos: SosResult;
  compositeValue: number;
  /** Overall rank by VBD (1 = best value in the whole pool). Null only if the pool is empty. */
  vorpRank: number | null;
  /** Overall rank by market signal — ADP if imported/synced, else Sleeper's search_rank. Null if neither exists. */
  marketRank: number | null;
  /** marketRank - vorpRank. Positive = market drafts him later than his value ("can wait"). Negative = market drafts him earlier ("won't last"/reach). Null if marketRank is null. */
  valueDelta: number | null;
};

/** One slot instance in a team's starting lineup, filled or empty. */
export type TeamSlotAssignment = {
  slot: SlotType;
  player: WarRoomRow | null;
};

export type TeamStrength = {
  assignments: TeamSlotAssignment[];
  /** Sum of projected points across all filled starting slots. */
  startingPoints: number;
  /** Sum of VBD across all filled starting slots — value added over a replacement-level team. */
  startingVbd: number;
  /** Everyone on the roster who didn't fit a starting slot — may exceed benchCapacity if the roster's over capacity. */
  bench: WarRoomRow[];
  filledSlots: number;
  /** Starting-lineup slot count (QB/RB/WR/TE/FLEX/SUPER_FLEX only — not bench). */
  totalSlots: number;
  /** Position(s) still needed to fill an empty dedicated/flex-eligible slot, most-empty first. */
  openPositions: Position[];
  /** How many of the league's bench slots are still open. */
  benchOpen: number;
  /** League's bench slot count, straight from roster settings. */
  benchCapacity: number;
  /** Whole-roster capacity: starting slots + bench. */
  rosterCapacity: number;
  /** True once the roster has filled every starting slot and every bench slot. */
  rosterFull: boolean;
};
