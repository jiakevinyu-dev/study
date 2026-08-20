"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { LeagueSettings } from "@/lib/fantasy/types";
import { cn } from "@/lib/utils";
import { Card, FieldLabel, inputClass } from "./ui";

type Props = {
  league: LeagueSettings;
  onChange: (league: LeagueSettings) => void;
};

const ROSTER_SLOT_FIELDS: { key: keyof LeagueSettings["roster"]; label: string }[] = [
  { key: "QB", label: "QB" },
  { key: "RB", label: "RB" },
  { key: "WR", label: "WR" },
  { key: "TE", label: "TE" },
  { key: "FLEX", label: "FLEX (RB/WR/TE)" },
  { key: "SUPER_FLEX", label: "SUPERFLEX (QB/RB/WR/TE)" },
  { key: "BENCH", label: "Bench" },
];

const SCORING_FIELDS: { key: keyof LeagueSettings["scoring"]; label: string; step: number }[] = [
  { key: "rec", label: "Points / reception (PPR)", step: 0.25 },
  { key: "teRecBonus", label: "TE premium bonus / reception", step: 0.25 },
  { key: "passTd", label: "Points / passing TD", step: 0.5 },
  { key: "passYd", label: "Points / passing yard", step: 0.01 },
  { key: "passInt", label: "Points / interception", step: 0.5 },
  { key: "rushTd", label: "Points / rushing TD", step: 0.5 },
  { key: "rushYd", label: "Points / rushing yard", step: 0.01 },
  { key: "recTd", label: "Points / receiving TD", step: 0.5 },
  { key: "recYd", label: "Points / receiving yard", step: 0.01 },
  { key: "fumbleLost", label: "Points / fumble lost", step: 0.5 },
];

export function SettingsPanel({ league, onChange }: Props) {
  const [open, setOpen] = useState(true);

  const setTeams = (teams: number) => onChange({ ...league, teams: Math.max(2, teams) });
  const setRoster = (key: keyof LeagueSettings["roster"], value: number) =>
    onChange({ ...league, roster: { ...league.roster, [key]: Math.max(0, value) } });
  const setScoring = (key: keyof LeagueSettings["scoring"], value: number) =>
    onChange({ ...league, scoring: { ...league.scoring, [key]: value } });
  const setPlayoffWeeks = (raw: string) => {
    const weeks = raw
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    onChange({ ...league, playoffWeeks: weeks });
  };
  const poolRelevanceCutoff = league.poolRelevanceCutoff ?? 300;
  const setPoolRelevanceCutoff = (raw: string) => {
    const trimmed = raw.trim();
    onChange({ ...league, poolRelevanceCutoff: trimmed === "" ? null : Math.max(1, Number(trimmed)) });
  };

  const isSuperflex = league.roster.SUPER_FLEX > 0;
  const isPpr = league.scoring.rec >= 0.75;
  const isTePremium = league.scoring.teRecBonus > 0;

  return (
    <Card>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h3 className="font-display text-lg font-medium text-fg">League Settings</h3>
          <p className="mt-1 text-xs text-muted">
            {league.teams}-team &middot; {isSuperflex ? "Superflex" : "1-QB"} &middot; {isPpr ? "PPR" : "Non-PPR"} &middot;{" "}
            {isTePremium ? "TE premium" : "No TE premium"}
          </p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-5 space-y-6">
          {league.leagueName && (
            <p className="rounded-lg bg-bg-inset px-3 py-2 text-xs text-muted">
              Synced from Sleeper league &ldquo;{league.leagueName}&rdquo;. Edit anything below to see the board recompute live.
            </p>
          )}

          <div>
            <FieldLabel>Teams</FieldLabel>
            <input
              type="number"
              className={inputClass}
              value={league.teams}
              onChange={(e) => setTeams(Number(e.target.value))}
              min={2}
              max={32}
            />
          </div>

          <div>
            <FieldLabel>Starting roster slots</FieldLabel>
            <div className="mt-1.5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {ROSTER_SLOT_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted">{f.label}</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={league.roster[f.key]}
                    onChange={(e) => setRoster(f.key, Number(e.target.value))}
                    min={0}
                    max={12}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Scoring</FieldLabel>
            <div className="mt-1.5 grid grid-cols-2 gap-3">
              {SCORING_FIELDS.map((f) => (
                <div key={f.key}>
                  <label className="text-xs text-muted">{f.label}</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={league.scoring[f.key]}
                    step={f.step}
                    onChange={(e) => setScoring(f.key, Number(e.target.value))}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <FieldLabel>Fantasy playoff weeks (comma-separated)</FieldLabel>
            <input className={inputClass} value={league.playoffWeeks.join(", ")} onChange={(e) => setPlayoffWeeks(e.target.value)} />
          </div>

          <div>
            <FieldLabel>Hide players ranked worse than (ADP / search_rank)</FieldLabel>
            <input
              type="number"
              className={inputClass}
              value={poolRelevanceCutoff ?? ""}
              placeholder="No cutoff"
              onChange={(e) => setPoolRelevanceCutoff(e.target.value)}
              min={1}
            />
            <p className="mt-1 text-xs text-muted">
              Sleeper&rsquo;s full player list runs to a couple thousand names — most are practice-squad or deep-inactive
              players no redraft league will ever start. Clear the field to show every synced player instead.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
