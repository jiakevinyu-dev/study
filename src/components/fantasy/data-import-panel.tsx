"use client";

import { useRef, useState } from "react";
import { ChevronDown, Download, Upload } from "lucide-react";
import { downloadCsv } from "@/lib/fantasy/csv";
import {
  importDefenseCsv,
  importGamesMissedCsv,
  importProjectionsCsv,
  importRankingsCsv,
  importScheduleCsv,
  mergeImportedRows,
} from "@/lib/fantasy/imports";
import { EXAMPLE_PLAYERS } from "@/lib/fantasy/sample-data";
import type { DefenseRating, Player, ScheduleEntry } from "@/lib/fantasy/types";
import { cn } from "@/lib/utils";
import { Badge, buttonSecondaryClass, Card } from "./ui";

type Props = {
  players: Player[];
  schedule: ScheduleEntry[];
  defense: DefenseRating[];
  gamesMissedCount: number;
  onPlayersChange: (players: Player[]) => void;
  onScheduleChange: (schedule: ScheduleEntry[]) => void;
  onDefenseChange: (defense: DefenseRating[]) => void;
  onGamesMissedChange: (map: Record<string, number>) => void;
};

async function readFile(file: File): Promise<string> {
  return file.text();
}

function ImportRow({
  label,
  status,
  onFile,
  onTemplate,
}: {
  label: string;
  status: string;
  onFile: (text: string) => void;
  onTemplate: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
      <div>
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-xs text-muted">{status}</p>
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={onTemplate} className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-fg">
          <Download className="h-3 w-3" aria-hidden="true" />
          Template
        </button>
        <button type="button" onClick={() => inputRef.current?.click()} className={buttonSecondaryClass}>
          <Upload className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
          Import CSV
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            onFile(await readFile(file));
            e.target.value = "";
          }}
        />
      </div>
    </div>
  );
}

export function DataImportPanel({
  players,
  schedule,
  defense,
  gamesMissedCount,
  onPlayersChange,
  onScheduleChange,
  onDefenseChange,
  onGamesMissedChange,
}: Props) {
  const [open, setOpen] = useState(false);

  const projectionCount = players.filter((p) => p.projStats).length;
  const adpCount = players.filter((p) => p.adp != null).length;

  return (
    <Card>
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
        <div>
          <h3 className="font-display text-lg font-medium text-fg">Data Sources</h3>
          <p className="mt-1 text-xs text-muted">Rankings, projections, schedule &amp; defense — bring your own, or start from the sample.</p>
        </div>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted transition-transform", open && "rotate-180")} aria-hidden="true" />
      </button>

      {open && (
        <div className="mt-5 space-y-3">
          <ImportRow
            label="Rankings / ADP"
            status={adpCount > 0 ? `${adpCount} players have ADP on file` : "No ADP imported — falls back to Sleeper's search_rank"}
            onFile={(text) => onPlayersChange(mergeImportedRows(players, importRankingsCsv(text)))}
            onTemplate={() =>
              downloadCsv("adp-template.csv", ["Player", "Position", "Team", "ADP"], [
                ["Example Player", "RB", "EX", "4.2"],
              ])
            }
          />
          <ImportRow
            label="Stat projections"
            status={
              projectionCount > 0
                ? `${projectionCount} players have full stat projections (scoring settings apply live)`
                : "No projections imported — points estimated from ADP curve"
            }
            onFile={(text) => onPlayersChange(mergeImportedRows(players, importProjectionsCsv(text)))}
            onTemplate={() =>
              downloadCsv(
                "projections-template.csv",
                ["Player", "Position", "Team", "PassYd", "PassTd", "PassInt", "RushYd", "RushTd", "Rec", "RecYd", "RecTd", "Fum"],
                [["Example Player", "QB", "EX", "4200", "28", "10", "350", "3", "0", "0", "0", "4"]]
              )
            }
          />
          <ImportRow
            label="Schedule"
            status={schedule.length > 0 ? `${schedule.length} games loaded` : "Not loaded — SoS grades show — until imported"}
            onFile={(text) => onScheduleChange(importScheduleCsv(text))}
            onTemplate={() =>
              downloadCsv("schedule-template.csv", ["Team", "Week", "Opponent", "HomeAway"], [
                ["EX", "1", "OPP", "Home"],
                ["EX", "2", "BYE", ""],
              ])
            }
          />
          <ImportRow
            label="Defense vs. position"
            status={defense.length > 0 ? `${defense.length} team/position ratings loaded` : "Not loaded — needed alongside schedule for SoS"}
            onFile={(text) => onDefenseChange(importDefenseCsv(text))}
            onTemplate={() =>
              downloadCsv("defense-template.csv", ["Team", "Position", "RankVsPosition"], [
                ["OPP", "RB", "12"],
                ["OPP", "WR", "20"],
              ])
            }
          />
          <ImportRow
            label="Recent injury history"
            status={gamesMissedCount > 0 ? `${gamesMissedCount} players have games-missed on file` : "Optional — refines the injury-risk score"}
            onFile={(text) => onGamesMissedChange(importGamesMissedCsv(text))}
            onTemplate={() => downloadCsv("games-missed-template.csv", ["Player", "GamesMissed"], [["Example Player", "3"]])}
          />

          <div className="flex items-center justify-between gap-3 rounded-lg bg-bg-inset px-3 py-2.5">
            <div>
              <p className="text-sm font-medium text-fg">Load example dataset</p>
              <p className="text-xs text-muted">
                A handful of fictitious placeholder players so you can try the engine before syncing real data.
              </p>
            </div>
            <button type="button" onClick={() => onPlayersChange(mergeImportedRows(players, EXAMPLE_PLAYERS))} className={buttonSecondaryClass}>
              Load sample
            </button>
          </div>

          <p className="pt-1 text-xs leading-relaxed text-muted">
            <Badge tone="neutral" className="mr-1.5">
              Note
            </Badge>
            No real 2026 schedule, defensive rankings, or ADP ship with this tool — they change constantly and this
            build had no network access to verify current data. Sync Sleeper or import your own for live numbers.
          </p>
        </div>
      )}
    </Card>
  );
}
