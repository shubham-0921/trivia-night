"use client";

import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { TeamDot } from "@/components/ui/TeamDot";
import { DIFF_LEVELS, ROUNDS, ROUND_GROUPS, groupIndexForRound } from "@/lib/data";
import { activeRoundIndexCount, getRoundQuestions, getTurnFor, qKeyOf } from "@/lib/gameReducer";
import { cn } from "@/lib/cn";
import type { DiffKey } from "@/lib/types";

function formatClock(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m < 10 ? "0" : ""}${m}:${s < 10 ? "0" : ""}${s}`;
}

const DIFF_COLOR: Record<DiffKey, string> = {
  easy: "var(--good)",
  medium: "var(--gold)",
  hard: "var(--accent)",
};

export function GameScreen() {
  const { state, dispatch } = useGame();
  const round = ROUNDS[state.currentRound];
  const roundQuestions = getRoundQuestions(state, state.currentRound);
  const q = roundQuestions[state.currentQ % roundQuestions.length];
  const turn = getTurnFor(state, state.currentRound, state.currentQ);
  const qKey = qKeyOf(state.currentRound, state.currentQ);
  const hintsKey = `${qKey}-hints`;

  const chosenKey = state.turnDifficulty[qKey];
  const chosenLevel = DIFF_LEVELS.find((d) => d.key === chosenKey);
  const revealed = !!state.revealedAnswers[qKey];
  const hintsShown = state.hintsShown[hintsKey] ?? 0;

  const isLastQ = state.currentQ === roundQuestions.length - 1;
  const isLastRound = state.currentRound === activeRoundIndexCount(state) - 1;
  const isLast = isLastQ && isLastRound;
  const isFirst = state.currentQ === 0 && state.currentRound === 0;

  const activeTeamId = turn.teamId;
  const activeGroups = ROUND_GROUPS.slice(0, state.numRounds);

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <div className="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-4 border-b border-line bg-bg py-4">
        <div className="flex items-center gap-3.5">
          <span className="rounded-full bg-accent-soft px-3 py-1.5 text-sm font-bold uppercase tracking-wider text-accent">
            Total time left
          </span>
          <span
            className={cn(
              "rounded-2xl px-6 py-2 font-mono text-[2.75rem] font-extrabold leading-none tabular-nums",
              state.globalTimerSeconds <= 300 ? "bg-bad/15 text-bad" : "bg-accent-soft text-accent"
            )}
          >
            {formatClock(state.globalTimerSeconds)}
          </span>
          <Button onClick={() => dispatch({ type: "TOGGLE_GLOBAL_TIMER" })}>
            {state.globalTimerRunning ? "Pause" : "Start"}
          </Button>
          <Button variant="ghost" onClick={() => dispatch({ type: "RESET_GLOBAL_TIMER" })}>
            Reset
          </Button>
        </div>
        <div className="rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold uppercase tracking-wider text-accent">
          Round {groupIndexForRound(state.currentRound) + 1} / {state.numRounds} · {round.title.split(" — ")[0]}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-[1fr_300px] items-start gap-5 max-[860px]:grid-cols-1">
        <div className="flex min-h-[320px] flex-col rounded-[24px] border border-line bg-bg-raised p-7 card-shadow">
          <div className="mb-1 flex items-center gap-2.5">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-accent-soft text-xl">
              {round.icon}
            </span>
            <h2 className="text-xl font-extrabold">{round.title}</h2>
          </div>
          <div className="mb-5 text-[0.82rem] font-semibold text-ink-faint">
            Turn {state.currentQ + 1} of {roundQuestions.length} · budget {round.budget}
          </div>

          <div
            className="mb-6 inline-flex w-fit items-center gap-3 rounded-[1.75rem] border border-line bg-bg-sunken py-3 pl-4 pr-5"
          >
            <TeamDot color={turn.teamColor} className="h-4 w-4" />
            <span className="text-lg font-semibold">
              It&apos;s{" "}
              <strong className="font-display text-3xl font-extrabold" style={{ color: `var(${turn.teamColor})` }}>
                {turn.name}
              </strong>
              &apos;s turn — {turn.teamName}
            </span>
          </div>

          {!chosenLevel ? (
            <div>
              <div className="mb-3.5 font-display text-base font-bold">
                Before the question — how hard does {turn.name} want to go?
              </div>
              <div className="flex flex-wrap gap-2.5">
                {DIFF_LEVELS.map((level) => (
                  <button
                    key={level.key}
                    onClick={() => dispatch({ type: "SELECT_DIFFICULTY", diff: level.key })}
                    className="flex flex-col items-start gap-1 rounded-2xl border-2 px-5 py-3.5 text-[0.95rem] font-extrabold pop-shadow transition-colors"
                    style={{ borderColor: DIFF_COLOR[level.key] }}
                  >
                    {level.label}
                    <span className="text-[0.72rem] font-bold text-ink-faint">
                      +{level.points} pt{level.points > 1 ? "s" : ""}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-1 flex-col">
              <div
                className="mb-4 inline-flex w-fit items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
                style={{
                  background:
                    chosenLevel.key === "hard" ? "var(--accent-soft)" : `color-mix(in srgb, ${DIFF_COLOR[chosenLevel.key]} 18%, transparent)`,
                  color: DIFF_COLOR[chosenLevel.key],
                }}
              >
                {chosenLevel.label} — worth {chosenLevel.points} pt{chosenLevel.points > 1 ? "s" : ""}
              </div>

              {"flag" in q && q.flag ? (
                <div>
                  <div
                    className="mb-3 text-[4rem] leading-none transition-[filter] duration-500"
                    style={{ filter: `blur(${Math.max(0, 6 - hintsShown * 3)}px)` }}
                  >
                    {q.flag}
                  </div>
                  <ul className="mb-4 flex flex-col gap-1.5">
                    {q.hints.slice(0, hintsShown).map((hint, i) => (
                      <li key={i} className="rounded-xl bg-bg-sunken px-3.5 py-2 text-[0.92rem]">
                        {hint}
                      </li>
                    ))}
                  </ul>
                  {hintsShown < q.hints.length && (
                    <Button onClick={() => dispatch({ type: "REVEAL_NEXT_HINT" })}>
                      Reveal hint {hintsShown + 1} of {q.hints.length}
                    </Button>
                  )}
                </div>
              ) : (
                <div>
                  {"kicker" in q && q.kicker && (
                    <div className="mb-2 text-[0.72rem] font-extrabold uppercase tracking-wider text-gold">
                      {q.kicker}
                    </div>
                  )}
                  <div className="mb-4 font-display text-2xl font-extrabold leading-snug">{q.prompt}</div>
                </div>
              )}

              <div className="mt-auto border-t border-dashed border-line pt-4">
                <Button onClick={() => dispatch({ type: "TOGGLE_ANSWER" })}>
                  {revealed ? "Hide answer" : "Reveal answer"}
                </Button>
                {revealed && (
                  <>
                    <div className="mt-2 text-[1.15rem] font-bold text-good">Answer: {q.answer}</div>
                    <div className="mt-3 flex gap-2.5">
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => dispatch({ type: "SCORE_DELTA", teamId: turn.teamId, delta: chosenLevel.points })}
                      >
                        ✅ Correct (+{chosenLevel.points})
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dispatch({ type: "SCORE_DELTA", teamId: turn.teamId, delta: 0 })}
                      >
                        ❌ Wrong (+0)
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-wrap gap-2.5">
            <Button disabled={isFirst} onClick={() => dispatch({ type: "PREV_TURN" })}>
              ← Prev turn
            </Button>
            <Button
              variant="primary"
              onClick={() => dispatch({ type: isLast ? "FINISH_GAME" : "NEXT_TURN" })}
            >
              {isLast ? "Finish game →" : "Next →"}
            </Button>
            {chosenLevel && (
              <span
                className={cn(
                  "ml-auto inline-flex items-center gap-2.5 self-center rounded-full border-2 px-5 py-2.5 font-mono text-2xl font-extrabold tabular-nums",
                  state.qTimerSeconds <= 10 ? "border-bad bg-bad/10 text-bad" : "border-line bg-bg-sunken"
                )}
              >
                ⏱ {state.qTimerSeconds}s
                <button
                  title="Restart 30s"
                  onClick={() => dispatch({ type: "RESTART_Q_TIMER" })}
                  className="rounded px-1 text-lg text-ink-faint hover:text-accent"
                >
                  ↺
                </button>
              </span>
            )}
          </div>
        </div>

        <div className="sticky top-[5.5rem] rounded-[20px] border border-line bg-bg-raised p-4.5 card-shadow">
          <h3 className="mb-3 text-[0.95rem] font-extrabold">Scoreboard</h3>
          <div>
            {[...state.teams]
              .sort((a, b) => (state.scores[b.id] ?? 0) - (state.scores[a.id] ?? 0))
              .map((team) => (
                <div
                  key={team.id}
                  className={cn(
                    "flex items-center gap-2 rounded-[10px] border-b border-line py-2 last:border-b-0",
                    team.id === activeTeamId && "-mx-2 bg-accent-soft px-2"
                  )}
                >
                  <TeamDot color={team.color} className="h-2.5 w-2.5" />
                  <span className="flex-1 text-[0.88rem] font-bold">{team.name}</span>
                  <span className="min-w-[1.6rem] text-right font-bold tabular-nums">{state.scores[team.id] ?? 0}</span>
                  <div className="flex gap-1">
                    {[-1, 1, 2, 3].map((delta) => (
                      <button
                        key={delta}
                        onClick={() => dispatch({ type: "SCORE_DELTA", teamId: team.id, delta })}
                        className="rounded-full border-2 border-line px-1.5 py-0.5 text-[0.72rem] font-bold hover:border-accent"
                      >
                        {delta > 0 ? "+" : ""}
                        {delta}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-4">
        {activeGroups.map((group, gIdx) => (
          <div key={group.title} className="flex flex-wrap items-center gap-1.5">
            <span className="mr-0.5 text-[0.68rem] font-extrabold uppercase tracking-wider text-ink-faint">
              {group.title}
              {gIdx === groupIndexForRound(state.currentRound) ? " •" : ""}
            </span>
            {group.roundIndexes.map((idx) => {
              const r = ROUNDS[idx];
              const current = idx === state.currentRound;
              const done = idx < state.currentRound;
              return (
                <button
                  key={r.key}
                  onClick={() => dispatch({ type: "JUMP_TO_ROUND", roundIndex: idx })}
                  className={cn(
                    "rounded-full border-2 px-3 py-1.5 text-xs font-bold",
                    current
                      ? "border-accent bg-accent text-white pop-shadow"
                      : done
                        ? "border-good text-good"
                        : "border-line bg-bg-raised text-ink-faint"
                  )}
                >
                  {r.icon} {r.title.split(" — ")[0]}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
