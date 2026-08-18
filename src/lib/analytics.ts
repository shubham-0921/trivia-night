import type { GameState } from "./gameReducer";
import type { DiffKey } from "./types";

export interface GameResultsPayload {
  numRounds: number;
  teams: {
    teamKey: string;
    teamName: string;
    captainName: string | null;
    memberNames: string[];
    finalScore: number;
  }[];
  playerOrders: {
    teamKey: string;
    teamName: string;
    position: number;
    playerName: string;
  }[];
  difficultyPicks: {
    teamKey: string;
    teamName: string;
    playerName: string;
    roundTitle: string;
    difficulty: DiffKey;
  }[];
}

export function buildGameResultsPayload(state: GameState): GameResultsPayload {
  const teams = state.teams.map((team) => ({
    teamKey: team.id,
    teamName: team.name,
    captainName: state.captains[team.id] ?? null,
    memberNames: team.members,
    finalScore: state.scores[team.id] ?? 0,
  }));

  const playerOrders: GameResultsPayload["playerOrders"] = [];
  state.teams.forEach((team) => {
    const order = state.playerOrder[team.id] ?? team.members;
    order.forEach((playerName, idx) => {
      playerOrders.push({ teamKey: team.id, teamName: team.name, position: idx + 1, playerName });
    });
  });

  const difficultyPicks = state.difficultyLog.map((entry) => ({
    teamKey: entry.teamId,
    teamName: entry.teamName,
    playerName: entry.player,
    roundTitle: entry.round,
    difficulty: entry.difficulty,
  }));

  return { numRounds: state.numRounds, teams, playerOrders, difficultyPicks };
}

export async function submitGameResults(payload: GameResultsPayload): Promise<{ ok: boolean }> {
  try {
    const res = await fetch("/api/games", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return { ok: res.ok };
  } catch {
    return { ok: false };
  }
}
