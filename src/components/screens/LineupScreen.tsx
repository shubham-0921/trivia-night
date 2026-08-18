"use client";

import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Pill";
import { TeamDot } from "@/components/ui/TeamDot";
import { cn } from "@/lib/cn";

export function LineupScreen() {
  const { state, dispatch } = useGame();

  const team = state.teams[Math.min(state.lineupTeamIndex, state.teams.length - 1)] ?? state.teams[0];
  const order = state.playerOrder[team.id] ?? team.members;
  const isLastTeam = state.lineupTeamIndex === state.teams.length - 1;

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <Eyebrow>Trivia Night &middot; Calling Order</Eyebrow>
      <h1 className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">Who goes when?</h1>
      <p className="mb-7 mt-2 max-w-[60ch] text-[0.98rem] text-ink-soft">
        One team at a time: set the order your players get called in. Player 1 answers your team&apos;s
        first turn, player 2 the second, and so on — it wraps back to the top once everyone&apos;s gone.
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
          const current = idx === state.lineupTeamIndex;
          return (
            <button
              key={t.id}
              title={t.name}
              onClick={() => dispatch({ type: "SET_LINEUP_TEAM_INDEX", index: idx })}
              className={cn(
                "h-[0.55rem] rounded-full border-0 p-0 transition-all",
                current ? "w-6" : "w-[0.55rem] bg-good"
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

      <div className="rounded-[20px] border border-line bg-bg-raised p-5 card-shadow">
        <h3 className="mb-3 text-base font-semibold">Calling order</h3>
        {order.length === 0 ? (
          <div className="text-sm italic text-ink-faint">No players on this team yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {order.map((name, idx) => (
              <div
                key={name}
                className="flex items-center gap-3 rounded-2xl border border-line bg-bg-sunken py-2.5 pl-4 pr-2.5"
              >
                <span className="w-5 text-sm font-mono font-bold text-ink-faint">{idx + 1}</span>
                <span className="flex-1 font-semibold">{name}</span>
                <div className="flex gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => dispatch({ type: "MOVE_PLAYER_ORDER", teamId: team.id, name, direction: "up" })}
                    className="rounded-full border-2 border-line px-2 py-1 text-xs font-bold hover:border-accent disabled:opacity-30"
                    title="Move up"
                  >
                    ↑
                  </button>
                  <button
                    disabled={idx === order.length - 1}
                    onClick={() => dispatch({ type: "MOVE_PLAYER_ORDER", teamId: team.id, name, direction: "down" })}
                    className="rounded-full border-2 border-line px-2 py-1 text-xs font-bold hover:border-accent disabled:opacity-30"
                    title="Move down"
                  >
                    ↓
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="mt-4"
          onClick={() => dispatch({ type: "SHUFFLE_PLAYER_ORDER", teamId: team.id })}
        >
          🎲 Shuffle order
        </Button>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button
          variant="ghost"
          size="sm"
          disabled={state.lineupTeamIndex === 0}
          onClick={() => dispatch({ type: "SET_LINEUP_TEAM_INDEX", index: state.lineupTeamIndex - 1 })}
        >
          ← Prev team
        </Button>
        <Button
          variant="primary"
          className="ml-auto"
          onClick={() => {
            if (isLastTeam) dispatch({ type: "CONFIRM_LINEUP_AND_START" });
            else dispatch({ type: "SET_LINEUP_TEAM_INDEX", index: state.lineupTeamIndex + 1 });
          }}
        >
          {isLastTeam ? "Confirm Order → Start Trivia Night" : "Next team →"}
        </Button>
      </div>
    </div>
  );
}
