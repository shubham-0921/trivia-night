"use client";

import { useState } from "react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Pill";
import { TeamDot } from "@/components/ui/TeamDot";
import { ROUNDS } from "@/lib/data";
import { activeRoundIndexCount } from "@/lib/gameReducer";
import { cn } from "@/lib/cn";

export function LineupScreen() {
  const { state, dispatch } = useGame();
  const [selectedMember, setSelectedMember] = useState<string | null>(null);
  const activeRounds = ROUNDS.slice(0, activeRoundIndexCount(state));

  const team = state.teams[Math.min(state.lineupTeamIndex, state.teams.length - 1)] ?? state.teams[0];
  const teamLineup = state.lineup[team.id] ?? {};
  const mode = state.lineupMode[team.id];
  const isLastTeam = state.lineupTeamIndex === state.teams.length - 1;

  function goToTeam(idx: number) {
    setSelectedMember(null);
    dispatch({ type: "SET_LINEUP_TEAM_INDEX", index: idx });
  }

  function assign(roundKey: string, player: string) {
    dispatch({ type: "SET_LINEUP_ASSIGNMENT", teamId: team.id, roundKey, player });
    setSelectedMember(null);
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <Eyebrow>Trivia Night &middot; Category Draft</Eyebrow>
      <h1 className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">Who&apos;s playing what?</h1>
      <p className="mb-7 mt-2 max-w-[60ch] text-[0.98rem] text-ink-soft">
        One team at a time: each team first decides whether to be randomly assigned or choose for
        themselves, then maps a player to every category.
      </p>

      <div className="mb-2 flex items-center gap-2.5">
        <TeamDot color={team.color} className="h-[0.9rem] w-[0.9rem]" />
        <h2 className="text-2xl font-extrabold">{team.name}</h2>
        <span className="ml-1 font-mono text-xs text-ink-faint">
          Team {state.lineupTeamIndex + 1} of {state.teams.length}
        </span>
        {state.captains[team.id] && team.members.includes(state.captains[team.id]) && (
          <span className="ml-2 rounded-full bg-gold-soft px-2.5 py-1 text-xs font-bold text-gold">
            👑 {state.captains[team.id]}
          </span>
        )}
      </div>

      <div className="mb-6 flex gap-1.5">
        {state.teams.map((t, idx) => {
          const filled = activeRounds.every((r) => !!state.lineup[t.id]?.[r.key]);
          const current = idx === state.lineupTeamIndex;
          return (
            <button
              key={t.id}
              title={t.name}
              onClick={() => goToTeam(idx)}
              className={cn(
                "h-[0.55rem] rounded-full border-0 p-0 transition-all",
                current ? "w-6" : "w-[0.55rem]",
                current ? "" : filled ? "bg-good" : "bg-line"
              )}
              style={current ? { background: `var(${t.color})` } : undefined}
            />
          );
        })}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        <span className="text-sm font-semibold text-ink-soft">Captain:</span>
        {team.members.map((name) => {
          const isCaptain = state.captains[team.id] === name;
          return (
            <button
              key={name}
              onClick={() => dispatch({ type: "TOGGLE_CAPTAIN", teamId: team.id, name })}
              className={cn(
                "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all",
                isCaptain ? "border-gold bg-gold-soft text-ink" : "border-line bg-bg-sunken text-ink-soft hover:border-gold"
              )}
            >
              <span className={cn(isCaptain ? "opacity-100 grayscale-0" : "opacity-40 grayscale")}>👑</span>
              {name}
            </button>
          );
        })}
      </div>

      {!mode ? (
        <div>
          <p className="mb-4 font-display text-xl font-bold">How does this team want to fill their categories?</p>
          <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
            <button
              onClick={() => dispatch({ type: "SET_LINEUP_MODE", teamId: team.id, mode: "random" })}
              className="flex flex-col items-start gap-1.5 rounded-[20px] border-2 border-line bg-bg-raised p-6 text-left card-shadow transition-transform hover:-translate-y-0.5 hover:border-accent"
            >
              <span className="text-3xl">🎲</span>
              <span className="font-display text-lg font-extrabold">Random Assign</span>
              <span className="text-sm font-normal text-ink-soft">
                Players are shuffled into categories for you — still editable after.
              </span>
            </button>
            <button
              onClick={() => dispatch({ type: "SET_LINEUP_MODE", teamId: team.id, mode: "manual" })}
              className="flex flex-col items-start gap-1.5 rounded-[20px] border-2 border-line bg-bg-raised p-6 text-left card-shadow transition-transform hover:-translate-y-0.5 hover:border-accent"
            >
              <span className="text-3xl">🙋</span>
              <span className="font-display text-lg font-extrabold">Choose By Themselves</span>
              <span className="text-sm font-normal text-ink-soft">
                The team huddles and taps each player onto the category they want.
              </span>
            </button>
          </div>
        </div>
      ) : (
        <div>
          <div className="mb-4 inline-flex w-fit items-center rounded-full bg-accent-soft px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            {mode === "random" ? "🎲 Random assign" : "🙋 Chosen by the team"}
          </div>

          <div className="grid grid-cols-[280px_1fr] gap-5 max-[720px]:grid-cols-1">
            <Card>
              <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
                Players
                <span className="ml-auto font-mono text-xs font-normal text-ink-faint">{team.members.length}</span>
              </h3>
              <div className="flex flex-wrap gap-2.5">
                {team.members.length === 0 ? (
                  <span className="text-[0.88rem] italic text-ink-faint">No players on this team yet.</span>
                ) : (
                  team.members.map((name) => {
                    const timesUsed = activeRounds.filter((r) => teamLineup[r.key] === name).length;
                    const selected = selectedMember === name;
                    return (
                      <button
                        key={name}
                        onClick={() => setSelectedMember(selected ? null : name)}
                        className={cn(
                          "select-none rounded-full border border-line bg-bg-sunken px-3.5 py-2 text-[0.95rem] transition-all",
                          selected && "border-accent shadow-[0_0_0_3px_var(--accent-soft)]"
                        )}
                      >
                        {name}
                        {timesUsed > 0 && (
                          <span className="ml-1.5 text-[0.68rem] font-bold text-gold">×{timesUsed}</span>
                        )}
                      </button>
                    );
                  })
                )}
              </div>
            </Card>

            <Card>
              <h3 className="mb-3 text-base font-semibold">Categories</h3>
              <div className="flex flex-col gap-2.5">
                {activeRounds.map((round) => {
                  const assignee = teamLineup[round.key];
                  return (
                    <div
                      key={round.key}
                      onClick={() => selectedMember && assign(round.key, selectedMember)}
                      className={cn(
                        "flex cursor-pointer items-center gap-3.5 rounded-[14px] border border-line bg-bg-sunken px-3.5 py-2.5 transition-all hover:border-accent",
                        selectedMember && "outline-dashed outline-2 outline-accent outline-offset-2",
                        assignee && "border-dashed bg-bg-raised opacity-55 hover:opacity-100"
                      )}
                    >
                      <span className="flex-shrink-0 text-[1.3rem]">{round.icon}</span>
                      <span className="min-w-[110px] text-[0.92rem] font-semibold">{round.title.split(" — ")[0]}</span>
                      <span className="ml-auto flex items-center gap-2 text-sm">
                        {assignee ? (
                          <>
                            <span className="font-semibold text-good">✓ {assignee}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                dispatch({ type: "CLEAR_LINEUP_ASSIGNMENT", teamId: team.id, roundKey: round.key });
                              }}
                              className="rounded px-1 text-ink-faint hover:text-bad"
                            >
                              ✕
                            </button>
                          </>
                        ) : (
                          <span className="text-[0.85rem] italic text-ink-faint">Unassigned — tap a player first</span>
                        )}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "CHANGE_LINEUP_MODE", teamId: team.id })}
            >
              ↩ Change mode
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "RANDOMIZE_TEAM_LINEUP", teamId: team.id })}
            >
              🎲 Re-shuffle this team
            </Button>
          </div>
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={state.lineupTeamIndex === 0}
          onClick={() => goToTeam(state.lineupTeamIndex - 1)}
        >
          ← Prev team
        </Button>
        <Button
          variant="primary"
          className="ml-auto"
          disabled={!mode}
          onClick={() => {
            if (isLastTeam) dispatch({ type: "CONFIRM_LINEUP_AND_START" });
            else goToTeam(state.lineupTeamIndex + 1);
          }}
        >
          {isLastTeam ? "Confirm Lineup → Start Trivia Night" : "Next team →"}
        </Button>
      </div>
    </div>
  );
}
