"use client";

import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Eyebrow } from "@/components/ui/Pill";
import { DEFAULT_TEAMS, ROUNDS, ROUND_GROUPS } from "@/lib/data";
import { cn } from "@/lib/cn";

export function SetupScreen() {
  const { state, dispatch } = useGame();

  const presentCount = DEFAULT_TEAMS.reduce(
    (sum, t) => sum + t.members.filter((n) => state.attendance[n]).length,
    0
  );
  const totalCount = DEFAULT_TEAMS.reduce((sum, t) => sum + t.members.length, 0);

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <Eyebrow>Trivia Night &middot; Team Setup</Eyebrow>
      <h1 className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">Ready to draw teams</h1>
      <p className="mb-7 mt-2 max-w-[60ch] text-[0.98rem] text-ink-soft">
        Mark who&apos;s here and how many rounds you&apos;re playing, then hit shuffle — the teams stay
        hidden until the reveal.
      </p>

      <Card className="mb-5">
        <h3 className="mb-3 flex items-center gap-2 text-base font-semibold">
          Who&apos;s here tonight?
          <span className="ml-auto font-mono text-xs font-normal text-ink-faint">
            {presentCount} / {totalCount} playing tonight
          </span>
        </h3>
        <p className="-mt-1 mb-3 text-[0.82rem] text-ink-faint">
          Tap anyone who isn&apos;t coming to drop them out — their team stays the same, just smaller.
        </p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_TEAMS.map((homeTeam) =>
            homeTeam.members.map((name) => {
              const present = !!state.attendance[name];
              return (
                <button
                  key={name}
                  onClick={() => dispatch({ type: "TOGGLE_ATTENDANCE", name })}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border bg-bg-sunken px-3 py-1.5 text-sm transition-opacity",
                    present ? "border-line opacity-100" : "border-line opacity-45 line-through"
                  )}
                  style={{ borderLeft: `3px solid var(${homeTeam.color})` }}
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ background: present ? "var(--good)" : "var(--ink-faint)" }}
                  />
                  {name}
                </button>
              );
            })
          )}
        </div>
      </Card>

      <Card className="mb-5">
        <h3 className="mb-3 text-base font-semibold">How many rounds?</h3>
        <p className="-mt-1 mb-3 text-[0.82rem] text-ink-faint">
          Each round pairs two categories. Pick how many rounds tonight — you can always play fewer than all
          three.
        </p>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3">
          {ROUND_GROUPS.map((group, idx) => {
            const n = idx + 1;
            const selected = state.numRounds === n;
            const categories = ROUND_GROUPS.slice(0, n)
              .flatMap((g) => g.roundIndexes)
              .map((ri) => ROUNDS[ri]);
            return (
              <button
                key={n}
                onClick={() => dispatch({ type: "SET_NUM_ROUNDS", numRounds: n })}
                className={cn(
                  "flex flex-col items-start gap-1.5 rounded-2xl border-2 p-4 text-left transition-all",
                  selected ? "border-accent bg-accent-soft pop-shadow" : "border-line bg-bg-raised hover:border-accent"
                )}
              >
                <span className="font-display text-lg font-extrabold">
                  {n} {n === 1 ? "Round" : "Rounds"}
                </span>
                <span className="text-sm text-ink-soft">
                  {categories.map((c) => c.icon).join(" ")} — {categories.map((c) => c.title.split(" — ")[0]).join(", ")}
                </span>
              </button>
            );
          })}
        </div>
      </Card>

      <div className="mt-2 flex justify-center">
        <Button variant="primary" size="lg" onClick={() => dispatch({ type: "GO_TO_REVEAL" })}>
          🎲 Randomly Assign Teams
        </Button>
      </div>
      <p className="mt-3 text-center text-[0.8rem] text-ink-faint">
        Teams are already set behind the scenes — this plays the reveal.
      </p>
    </div>
  );
}
