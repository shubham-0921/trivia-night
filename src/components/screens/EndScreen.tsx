"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Pill";
import { Confetti, ConfettiHandle } from "@/components/Confetti";
import { DIFF_LEVELS, ROUNDS } from "@/lib/data";
import { buildGameResultsPayload, submitGameResults } from "@/lib/analytics";
import { cn } from "@/lib/cn";
import type { DiffKey } from "@/lib/types";

type SaveStatus = "saving" | "saved" | "error";

const DIFF_BAR_COLOR: Record<DiffKey, string> = {
  easy: "var(--good)",
  medium: "var(--gold)",
  hard: "var(--accent)",
};
const DIFF_LABEL_COLOR: Record<DiffKey, string> = DIFF_BAR_COLOR;

export function EndScreen() {
  const { state, dispatch } = useGame();
  const confettiRef = useRef<ConfettiHandle>(null);
  const [lineupRevealed, setLineupRevealed] = useState(false);
  const [diffRevealed, setDiffRevealed] = useState(false);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("saving");
  const submittedRef = useRef(false);

  useEffect(() => {
    confettiRef.current?.fire();
    setLineupRevealed(false);
    setDiffRevealed(false);

    if (submittedRef.current) return;
    submittedRef.current = true;
    const payload = buildGameResultsPayload(state);
    submitGameResults(payload).then((result) => setSaveStatus(result.ok ? "saved" : "error"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sorted = [...state.teams].sort((a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0));
  const winner = sorted[0];

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <Confetti ref={confettiRef} />
      <div className="pt-12 text-center">
        <Eyebrow>Game over</Eyebrow>
        <h2 className="text-2xl font-extrabold">And the winner is…</h2>
        <div className="my-2.5 bg-linear-to-br from-accent to-accent2 bg-clip-text text-[2.8rem] font-black text-transparent">
          {winner?.name ?? "—"}
        </div>

        <div
          className={cn(
            "mx-auto mb-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
            saveStatus === "saving" && "bg-bg-sunken text-ink-faint",
            saveStatus === "saved" && "bg-good-soft text-good",
            saveStatus === "error" && "bg-bad/15 text-bad"
          )}
        >
          {saveStatus === "saving" && "Saving game data…"}
          {saveStatus === "saved" && "✓ Game data saved"}
          {saveStatus === "error" && "Couldn't save game data (played fine locally though)"}
        </div>

        <div className="mx-auto mt-8 flex max-w-[360px] flex-col gap-2">
          {sorted.map((team, idx) => (
            <div
              key={team.id}
              className={cn(
                "flex justify-between rounded-2xl border border-line bg-bg-raised px-4.5 py-3 font-bold",
                idx === 0 && "border-gold bg-gold-soft/40"
              )}
            >
              <span>
                {idx + 1}. {team.name}
              </span>
              <span>{state.scores[team.id] ?? 0} pts</span>
            </div>
          ))}
        </div>

        <div className="flex flex-col items-center">
          <h3 className="mb-5 mt-10 text-lg font-bold">Who each team put where</h3>
          {!lineupRevealed ? (
            <Button variant="primary" onClick={() => setLineupRevealed(true)}>
              🔍 Reveal team lineups
            </Button>
          ) : (
            <div className="grid w-full max-w-[900px] animate-reveal-in grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5 text-left">
              {state.teams.map((team) => (
                <div
                  key={team.id}
                  className="rounded-[18px] border border-line bg-bg-raised p-4 card-shadow"
                  style={{ borderTop: `5px solid var(${team.color})` }}
                >
                  <h4 className="mb-2.5 font-display text-base font-extrabold">{team.name}</h4>
                  {ROUNDS.map((round) => (
                    <div
                      key={round.key}
                      className="flex items-center gap-2 border-b border-line py-1.5 text-sm last:border-b-0"
                    >
                      <span className="flex-shrink-0">{round.icon}</span>
                      <span className="min-w-[90px] text-ink-faint">{round.title.split(" — ")[0]}</span>
                      <span className="ml-auto font-semibold">{state.lineup[team.id]?.[round.key] ?? "—"}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center">
          <h3 className="mb-5 mt-10 text-lg font-bold">How each team played it</h3>
          {!diffRevealed ? (
            <Button variant="primary" onClick={() => setDiffRevealed(true)}>
              🎯 Reveal difficulty picks
            </Button>
          ) : (
            <div className="grid w-full max-w-[900px] animate-reveal-in grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5 text-left">
              {state.teams.map((team) => {
                const counts = state.difficultyChoices[team.id] ?? { easy: 0, medium: 0, hard: 0 };
                const total = counts.easy + counts.medium + counts.hard;
                return (
                  <div
                    key={team.id}
                    className="rounded-[18px] border border-line bg-bg-raised p-4 card-shadow"
                    style={{ borderTop: `5px solid var(${team.color})` }}
                  >
                    <h4 className="mb-2.5 font-display text-base font-extrabold">{team.name}</h4>
                    {total === 0 ? (
                      <div className="text-sm italic text-ink-faint">No picks recorded.</div>
                    ) : (
                      <>
                        <div className="mb-2.5 flex h-2.5 overflow-hidden rounded-full bg-bg-sunken">
                          {DIFF_LEVELS.map(
                            (level) =>
                              counts[level.key] > 0 && (
                                <span
                                  key={level.key}
                                  style={{
                                    width: `${(counts[level.key] / total) * 100}%`,
                                    background: DIFF_BAR_COLOR[level.key],
                                  }}
                                />
                              )
                          )}
                        </div>
                        {DIFF_LEVELS.map((level) => (
                          <div key={level.key} className="flex justify-between py-0.5 text-sm">
                            <span style={{ color: DIFF_LABEL_COLOR[level.key] }}>{level.label}</span>
                            <span>
                              {counts[level.key]} pick{counts[level.key] === 1 ? "" : "s"}
                            </span>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-center">
          <Button variant="primary" onClick={() => dispatch({ type: "RESTART_TO_SETUP" })}>
            Back to setup
          </Button>
        </div>
      </div>
    </div>
  );
}
