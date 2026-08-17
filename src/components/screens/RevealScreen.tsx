"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "@/context/GameContext";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Pill";
import { Confetti, ConfettiHandle } from "@/components/Confetti";
import type { Team } from "@/lib/types";

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function RevealScreen() {
  const { state, dispatch } = useGame();
  const confettiRef = useRef<ConfettiHandle>(null);

  // Freeze the "rigged" final assignment the moment this screen mounts —
  // the animation is fake, but it always lands on exactly this arrangement.
  const finalTeams = useMemo<Team[]>(() => state.teams.map((t) => ({ ...t })), []); // eslint-disable-line react-hooks/exhaustive-deps
  const allNames = useMemo(() => finalTeams.flatMap((t) => t.members), [finalTeams]);

  const [phase, setPhase] = useState<"shuffling" | "dealing" | "done">("shuffling");
  const [shuffleDisplay, setShuffleDisplay] = useState<string[]>(allNames);
  const [dealtByTeam, setDealtByTeam] = useState<Record<string, string[]>>({});

  useEffect(() => {
    let cancelled = false;
    let ticks = 0;

    const shuffleInterval = setInterval(() => {
      if (cancelled) return;
      setShuffleDisplay(shuffle(allNames));
      ticks++;
      if (ticks >= 12) {
        clearInterval(shuffleInterval);
        setPhase("dealing");
      }
    }, 160);

    return () => {
      cancelled = true;
      clearInterval(shuffleInterval);
    };
  }, [allNames]);

  useEffect(() => {
    if (phase !== "dealing") return;
    let cancelled = false;

    // suspenseful randomized DEAL ORDER — membership itself is unaffected
    const maxLen = Math.max(0, ...finalTeams.map((t) => t.members.length));
    const dealQueue: { teamId: string; name: string }[] = [];
    for (let pos = 0; pos < maxLen; pos++) {
      shuffle(finalTeams).forEach((team) => {
        if (team.members[pos] !== undefined) dealQueue.push({ teamId: team.id, name: team.members[pos] });
      });
    }

    let i = 0;
    function dealNext() {
      if (cancelled) return;
      if (i >= dealQueue.length) {
        setPhase("done");
        confettiRef.current?.fire();
        return;
      }
      const item = dealQueue[i];
      setDealtByTeam((prev) => ({ ...prev, [item.teamId]: [...(prev[item.teamId] ?? []), item.name] }));
      i++;
      setTimeout(dealNext, 220);
    }
    dealNext();

    return () => {
      cancelled = true;
    };
  }, [phase, finalTeams]);

  const statusText =
    phase === "shuffling" ? "Drawing names…" : phase === "dealing" ? "Dealing teams…" : "Teams are set!";

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <Confetti ref={confettiRef} />
      <div className="pt-8 text-center">
        <Eyebrow>Trivia Night</Eyebrow>
        <h2 className="mb-1 text-[clamp(1.6rem,5vw,2.3rem)] font-extrabold">Shuffling the deck…</h2>
        <p className="mb-9 text-ink-soft">Sit tight — teams are being drawn at random.</p>
        <div className="mb-4 min-h-[1.4rem] font-mono text-sm text-gold">{statusText}</div>

        {phase === "shuffling" && (
          <div className="mx-auto mb-8 flex min-h-[3rem] max-w-[720px] flex-wrap justify-center gap-2">
            {shuffleDisplay.map((name, i) => (
              <span key={i} className="rounded-full border border-line bg-bg-sunken px-3 py-1.5 text-sm">
                {name}
              </span>
            ))}
          </div>
        )}

        {phase !== "shuffling" && (
          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            {finalTeams.map((team) => (
              <div
                key={team.id}
                className="min-h-[150px] rounded-[18px] border border-line bg-bg-raised p-4 card-shadow"
                style={{ borderTop: `5px solid var(${team.color})` }}
              >
                <h3 className="mb-2.5 text-[1.05rem] font-semibold">{team.name}</h3>
                <div className="flex min-h-[2rem] flex-wrap gap-2">
                  {(dealtByTeam[team.id] ?? []).map((name, idx) => (
                    <span
                      key={name}
                      className="animate-deal-in rounded-full border border-line bg-bg-sunken px-3 py-1.5 text-[0.83rem] opacity-0"
                      style={{ animationDelay: `${idx * 20}ms` }}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {phase === "done" && (
          <div className="mt-8 flex justify-center">
            <Button variant="primary" onClick={() => dispatch({ type: "GO_TO_LINEUP" })}>
              Next: Set the lineup →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
