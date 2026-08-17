import Link from "next/link";
import { getOverallStats, listGames } from "@/db/queries";
import { DIFF_LEVELS } from "@/lib/data";
import type { DiffKey } from "@/lib/types";

export const dynamic = "force-dynamic";

const DIFF_COLOR: Record<DiffKey, string> = {
  easy: "var(--good)",
  medium: "var(--gold)",
  hard: "var(--accent)",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default async function AdminPage() {
  let games: Awaited<ReturnType<typeof listGames>> = [];
  let stats: Awaited<ReturnType<typeof getOverallStats>> | null = null;
  let dbError: string | null = null;

  try {
    [games, stats] = await Promise.all([listGames(), getOverallStats()]);
  } catch {
    dbError = "Couldn't reach the database. Check DATABASE_URL and that the schema has been migrated.";
  }

  return (
    <div className="mx-auto max-w-[1100px] px-6 pb-16 pt-8">
      <p className="mb-2 inline-block rounded-full bg-accent-soft px-3 py-1 text-xs font-extrabold uppercase tracking-[0.14em] text-accent">
        Admin &middot; Behavior Analytics
      </p>
      <h1 className="text-[clamp(2rem,5vw,2.8rem)] font-extrabold tracking-tight">Games</h1>
      <p className="mb-7 mt-2 max-w-[60ch] text-[0.98rem] text-ink-soft">
        Every finished game, with attendance, lineup, and difficulty-pick data. Select a game to see the
        full breakdown.
      </p>

      {dbError ? (
        <div className="rounded-2xl border border-bad/30 bg-bad/10 p-5 text-sm font-semibold text-bad">
          {dbError}
        </div>
      ) : (
        <>
          {stats && (
            <div className="mb-7 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-3.5">
              <StatTile label="Games played" value={stats.totalGames} />
              <StatTile label="Unique players seen" value={stats.totalPlayers} />
              <StatTile label="Difficulty picks logged" value={stats.totalDifficultyPicks} />
              <div className="rounded-[20px] border border-line bg-bg-raised p-4.5 card-shadow">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-faint">
                  Difficulty split
                </div>
                <div className="mb-2 flex h-2.5 overflow-hidden rounded-full bg-bg-sunken">
                  {DIFF_LEVELS.map(
                    (level) =>
                      stats.difficultyBreakdown[level.key] > 0 && (
                        <span
                          key={level.key}
                          style={{
                            width: `${(stats.difficultyBreakdown[level.key] / Math.max(1, stats.totalDifficultyPicks)) * 100}%`,
                            background: DIFF_COLOR[level.key],
                          }}
                        />
                      )
                  )}
                </div>
                <div className="flex justify-between text-xs text-ink-faint">
                  {DIFF_LEVELS.map((level) => (
                    <span key={level.key} style={{ color: DIFF_COLOR[level.key] }}>
                      {level.label} {stats.difficultyBreakdown[level.key]}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {games.length === 0 ? (
            <div className="rounded-[20px] border border-line bg-bg-raised p-8 text-center text-ink-faint card-shadow">
              No games recorded yet — finish a game and it&apos;ll show up here.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-[20px] border border-line bg-bg-raised card-shadow">
              <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-faint">
                    <th className="px-5 py-3.5 font-semibold">Played</th>
                    <th className="px-5 py-3.5 font-semibold">Rounds</th>
                    <th className="px-5 py-3.5 font-semibold">Teams</th>
                    <th className="px-5 py-3.5 font-semibold">Total points</th>
                    <th className="px-5 py-3.5 font-semibold">Winner</th>
                    <th className="px-5 py-3.5 font-semibold"></th>
                  </tr>
                </thead>
                <tbody>
                  {games.map((g) => (
                    <tr key={g.id} className="border-b border-line last:border-b-0 hover:bg-bg-sunken">
                      <td className="px-5 py-3.5 font-medium">{formatDate(g.createdAt)}</td>
                      <td className="px-5 py-3.5 tabular-nums">{g.numRounds}</td>
                      <td className="px-5 py-3.5 tabular-nums">{g.teamCount}</td>
                      <td className="px-5 py-3.5 tabular-nums font-semibold">{g.totalScore}</td>
                      <td className="px-5 py-3.5 font-semibold text-accent">{g.winnerTeamName ?? "—"}</td>
                      <td className="px-5 py-3.5 text-right">
                        <Link href={`/admin/${g.id}`} className="font-semibold text-accent hover:underline">
                          View →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[20px] border border-line bg-bg-raised p-4.5 card-shadow">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-faint">{label}</div>
      <div className="font-display text-3xl font-extrabold tabular-nums">{value}</div>
    </div>
  );
}
