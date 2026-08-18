import Link from "next/link";
import { notFound } from "next/navigation";
import { getGameDetail } from "@/db/queries";
import { DIFF_LEVELS } from "@/lib/data";
import { teamColorVar } from "@/lib/teamColor";
import type { DiffKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const DIFF_COLOR: Record<DiffKey, string> = {
  easy: "var(--good)",
  medium: "var(--gold)",
  hard: "var(--accent)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function GameDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let game: Awaited<ReturnType<typeof getGameDetail>> = null;
  let dbError: string | null = null;
  try {
    game = await getGameDetail(id);
  } catch {
    dbError = "Couldn't reach the database.";
  }

  if (dbError) {
    return (
      <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
        <div className="rounded-2xl border border-bad/30 bg-bad/10 p-5 text-sm font-semibold text-bad">
          {dbError}
        </div>
      </div>
    );
  }

  if (!game) notFound();

  const orderByTeam = new Map<string, typeof game.playerOrders>();
  game.playerOrders.forEach((o) => {
    orderByTeam.set(o.teamKey, [...(orderByTeam.get(o.teamKey) ?? []), o]);
  });

  const diffCountsByTeam = new Map<string, Record<DiffKey, number>>();
  game.difficultyPicks.forEach((p) => {
    const counts = diffCountsByTeam.get(p.teamKey) ?? { easy: 0, medium: 0, hard: 0 };
    counts[p.difficulty] += 1;
    diffCountsByTeam.set(p.teamKey, counts);
  });

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <Link href="/admin" className="mb-4 inline-block text-sm font-semibold text-accent hover:underline">
        ← All games
      </Link>
      <p className="mb-2 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
        Game detail
      </p>
      <h1 className="text-[clamp(1.8rem,5vw,2.4rem)] font-extrabold tracking-tight">{formatDate(game.createdAt)}</h1>
      <p className="mb-7 mt-2 text-[0.98rem] text-ink-soft">
        {game.numRounds} round{game.numRounds === 1 ? "" : "s"} played · winner{" "}
        <span className="font-bold text-accent">{game.winnerTeamName ?? "—"}</span>
      </p>

      <h2 className="mb-3.5 text-lg font-bold">Teams</h2>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
        {game.teams.map((team) => (
          <div
            key={team.teamKey}
            className="rounded-[18px] border border-line bg-bg-raised p-4.5 card-shadow"
            style={{ borderTop: `5px solid var(${teamColorVar(team.teamKey)})` }}
          >
            <div className="mb-1 flex items-center justify-between">
              <h3 className="font-display text-base font-extrabold">{team.teamName}</h3>
              <span className="font-mono text-lg font-extrabold tabular-nums">{team.finalScore}</span>
            </div>
            {team.captainName && (
              <div className="mb-2 text-xs font-bold text-gold">👑 Captain: {team.captainName}</div>
            )}
            <div className="text-sm text-ink-soft">{team.memberNames.join(", ")}</div>
          </div>
        ))}
      </div>

      <h2 className="mb-3.5 text-lg font-bold">Calling order each team set</h2>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
        {game.teams.map((team) => {
          const order = orderByTeam.get(team.teamKey) ?? [];
          return (
            <div
              key={team.teamKey}
              className="rounded-[18px] border border-line bg-bg-raised p-4.5 card-shadow"
              style={{ borderTop: `5px solid var(${teamColorVar(team.teamKey)})` }}
            >
              <h3 className="mb-2.5 font-display text-base font-extrabold">{team.teamName}</h3>
              {order.length === 0 ? (
                <div className="text-sm italic text-ink-faint">No order recorded.</div>
              ) : (
                order.map((o) => (
                  <div
                    key={o.position}
                    className="flex items-center gap-2 border-b border-line py-1.5 text-sm last:border-b-0"
                  >
                    <span className="w-5 font-mono text-ink-faint">{o.position}</span>
                    <span className="ml-auto font-semibold">{o.playerName}</span>
                  </div>
                ))
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mb-3.5 text-lg font-bold">How each team played it</h2>
      <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(240px,1fr))] gap-3.5">
        {game.teams.map((team) => {
          const counts = diffCountsByTeam.get(team.teamKey) ?? { easy: 0, medium: 0, hard: 0 };
          const total = counts.easy + counts.medium + counts.hard;
          return (
            <div
              key={team.teamKey}
              className="rounded-[18px] border border-line bg-bg-raised p-4.5 card-shadow"
              style={{ borderTop: `5px solid var(${teamColorVar(team.teamKey)})` }}
            >
              <h3 className="mb-2.5 font-display text-base font-extrabold">{team.teamName}</h3>
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
                            style={{ width: `${(counts[level.key] / total) * 100}%`, background: DIFF_COLOR[level.key] }}
                          />
                        )
                    )}
                  </div>
                  {DIFF_LEVELS.map((level) => (
                    <div key={level.key} className="flex justify-between py-0.5 text-sm">
                      <span style={{ color: DIFF_COLOR[level.key] }}>{level.label}</span>
                      <span>{counts[level.key]}</span>
                    </div>
                  ))}
                </>
              )}
            </div>
          );
        })}
      </div>

      <h2 className="mb-3.5 text-lg font-bold">Every difficulty pick</h2>
      {game.difficultyPicks.length === 0 ? (
        <div className="rounded-[18px] border border-line bg-bg-raised p-6 text-center text-ink-faint card-shadow">
          No picks recorded for this game.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-[20px] border border-line bg-bg-raised card-shadow">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                <th className="px-5 py-3 font-semibold">Team</th>
                <th className="px-5 py-3 font-semibold">Player</th>
                <th className="px-5 py-3 font-semibold">Round</th>
                <th className="px-5 py-3 font-semibold">Difficulty</th>
              </tr>
            </thead>
            <tbody>
              {game.difficultyPicks.map((p, i) => (
                <tr key={i} className="border-b border-line last:border-b-0">
                  <td className="px-5 py-2.5">{p.teamName}</td>
                  <td className="px-5 py-2.5 font-semibold">{p.playerName}</td>
                  <td className="px-5 py-2.5 text-ink-soft">{p.roundTitle}</td>
                  <td className="px-5 py-2.5">
                    <span className="font-semibold" style={{ color: DIFF_COLOR[p.difficulty] }}>
                      {p.difficulty[0].toUpperCase() + p.difficulty.slice(1)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
