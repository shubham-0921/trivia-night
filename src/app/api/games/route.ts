import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/db/client";
import type { GameResultsPayload } from "@/lib/analytics";

export const runtime = "nodejs";

function isValidPayload(body: unknown): body is GameResultsPayload {
  if (!body || typeof body !== "object") return false;
  const b = body as Record<string, unknown>;
  return (
    typeof b.numRounds === "number" &&
    Array.isArray(b.teams) &&
    Array.isArray(b.lineupChoices) &&
    Array.isArray(b.difficultyPicks)
  );
}

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isValidPayload(body)) {
    return NextResponse.json({ error: "Malformed game results payload" }, { status: 400 });
  }

  const { numRounds, teams, lineupChoices, difficultyPicks } = body;

  let sql;
  try {
    sql = getDb();
  } catch (err) {
    console.error("DB not configured:", err);
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const winner = teams.reduce<GameResultsPayload["teams"][number] | null>(
    (best, t) => (!best || t.finalScore > best.finalScore ? t : best),
    null
  );

  try {
    const gameId = await sql.begin(async (tx) => {
      const [game] = await tx<{ id: string }[]>`
        INSERT INTO games (num_rounds, winner_team_key, winner_team_name)
        VALUES (${numRounds}, ${winner?.teamKey ?? null}, ${winner?.teamName ?? null})
        RETURNING id
      `;

      for (const team of teams) {
        await tx`
          INSERT INTO game_teams (game_id, team_key, team_name, captain_name, member_names, final_score)
          VALUES (${game.id}, ${team.teamKey}, ${team.teamName}, ${team.captainName}, ${team.memberNames}, ${team.finalScore})
        `;
      }

      for (const choice of lineupChoices) {
        await tx`
          INSERT INTO lineup_choices (game_id, team_key, team_name, category_key, category_title, player_name, mode)
          VALUES (${game.id}, ${choice.teamKey}, ${choice.teamName}, ${choice.categoryKey}, ${choice.categoryTitle}, ${choice.playerName}, ${choice.mode})
        `;
      }

      for (const pick of difficultyPicks) {
        await tx`
          INSERT INTO difficulty_picks (game_id, team_key, team_name, player_name, round_title, difficulty)
          VALUES (${game.id}, ${pick.teamKey}, ${pick.teamName}, ${pick.playerName}, ${pick.roundTitle}, ${pick.difficulty})
        `;
      }

      return game.id;
    });

    return NextResponse.json({ ok: true, gameId });
  } catch (err) {
    console.error("Failed to save game results:", err);
    return NextResponse.json({ error: "Failed to save game results" }, { status: 500 });
  }
}
