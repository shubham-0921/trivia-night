import { getDb } from "./client";
import type { DiffKey } from "@/lib/types";

export interface GameListRow {
  id: string;
  createdAt: string;
  numRounds: number;
  winnerTeamName: string | null;
  teamCount: number;
  totalScore: number;
}

export async function listGames(): Promise<GameListRow[]> {
  const sql = getDb();
  const rows = await sql<
    { id: string; created_at: string; num_rounds: string; winner_team_name: string | null; team_count: string; total_score: string }[]
  >`
    SELECT
      g.id,
      g.created_at,
      g.num_rounds,
      g.winner_team_name,
      count(distinct t.id) AS team_count,
      coalesce(sum(t.final_score), 0) AS total_score
    FROM games g
    LEFT JOIN game_teams t ON t.game_id = g.id
    GROUP BY g.id, g.created_at, g.num_rounds, g.winner_team_name
    ORDER BY g.created_at DESC
  `;
  return rows.map((r) => ({
    id: r.id,
    createdAt: r.created_at,
    numRounds: Number(r.num_rounds),
    winnerTeamName: r.winner_team_name,
    teamCount: Number(r.team_count),
    totalScore: Number(r.total_score),
  }));
}

export interface OverallStats {
  totalGames: number;
  totalPlayers: number;
  totalDifficultyPicks: number;
  difficultyBreakdown: Record<DiffKey, number>;
}

export async function getOverallStats(): Promise<OverallStats> {
  const sql = getDb();
  const [gameCount] = await sql<{ n: string }[]>`SELECT count(*) AS n FROM games`;
  const [playerCount] = await sql<{ n: string }[]>`SELECT count(DISTINCT player_name) AS n FROM difficulty_picks`;
  const diffRows = await sql<{ difficulty: string; n: string }[]>`
    SELECT difficulty, count(*) AS n FROM difficulty_picks GROUP BY difficulty
  `;

  const difficultyBreakdown: Record<DiffKey, number> = { easy: 0, medium: 0, hard: 0 };
  let totalDifficultyPicks = 0;
  diffRows.forEach((r) => {
    const key = r.difficulty as DiffKey;
    difficultyBreakdown[key] = Number(r.n);
    totalDifficultyPicks += Number(r.n);
  });

  return {
    totalGames: Number(gameCount?.n ?? 0),
    totalPlayers: Number(playerCount?.n ?? 0),
    totalDifficultyPicks,
    difficultyBreakdown,
  };
}

export interface GameTeamRow {
  teamKey: string;
  teamName: string;
  captainName: string | null;
  memberNames: string[];
  finalScore: number;
}

export interface CategoryChoiceRow {
  teamKey: string;
  teamName: string;
  categoryKey: string;
  categoryTitle: string;
  playerName: string;
}

export interface DifficultyPickRow {
  teamKey: string;
  teamName: string;
  playerName: string;
  roundTitle: string;
  difficulty: DiffKey;
  pickedAt: string;
}

export interface GameDetail {
  id: string;
  createdAt: string;
  numRounds: number;
  winnerTeamKey: string | null;
  winnerTeamName: string | null;
  teams: GameTeamRow[];
  categoryChoices: CategoryChoiceRow[];
  difficultyPicks: DifficultyPickRow[];
}

export async function getGameDetail(gameId: string): Promise<GameDetail | null> {
  const sql = getDb();

  const [game] = await sql<
    { id: string; created_at: string; num_rounds: string; winner_team_key: string | null; winner_team_name: string | null }[]
  >`SELECT id, created_at, num_rounds, winner_team_key, winner_team_name FROM games WHERE id = ${gameId}`;
  if (!game) return null;

  const teamRows = await sql<
    { team_key: string; team_name: string; captain_name: string | null; member_names: string[]; final_score: string }[]
  >`SELECT team_key, team_name, captain_name, member_names, final_score FROM game_teams WHERE game_id = ${gameId} ORDER BY team_key`;

  const choiceRows = await sql<
    { team_key: string; team_name: string; category_key: string; category_title: string; player_name: string }[]
  >`SELECT team_key, team_name, category_key, category_title, player_name FROM category_choices WHERE game_id = ${gameId} ORDER BY team_key, category_key`;

  const diffRows = await sql<
    { team_key: string; team_name: string; player_name: string; round_title: string; difficulty: string; picked_at: string }[]
  >`SELECT team_key, team_name, player_name, round_title, difficulty, picked_at FROM difficulty_picks WHERE game_id = ${gameId} ORDER BY picked_at`;

  return {
    id: game.id,
    createdAt: game.created_at,
    numRounds: Number(game.num_rounds),
    winnerTeamKey: game.winner_team_key,
    winnerTeamName: game.winner_team_name,
    teams: teamRows.map((t) => ({
      teamKey: t.team_key,
      teamName: t.team_name,
      captainName: t.captain_name,
      memberNames: t.member_names,
      finalScore: Number(t.final_score),
    })),
    categoryChoices: choiceRows.map((c) => ({
      teamKey: c.team_key,
      teamName: c.team_name,
      categoryKey: c.category_key,
      categoryTitle: c.category_title,
      playerName: c.player_name,
    })),
    difficultyPicks: diffRows.map((d) => ({
      teamKey: d.team_key,
      teamName: d.team_name,
      playerName: d.player_name,
      roundTitle: d.round_title,
      difficulty: d.difficulty as DiffKey,
      pickedAt: d.picked_at,
    })),
  };
}
