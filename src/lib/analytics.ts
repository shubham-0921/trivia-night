import { ROUNDS } from "./data";
import type { GameState } from "./gameReducer";
import type { DiffKey, LineupMode } from "./types";

export interface GameResultsPayload {
  numRounds: number;
  teams: {
    teamKey: string;
    teamName: string;
    captainName: string | null;
    memberNames: string[];
    finalScore: number;
  }[];
  lineupChoices: {
    teamKey: string;
    teamName: string;
    categoryKey: string;
    categoryTitle: string;
    playerName: string;
    mode: LineupMode;
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

  const lineupChoices: GameResultsPayload["lineupChoices"] = [];
  state.teams.forEach((team) => {
    const teamLineup = state.lineup[team.id] ?? {};
    const mode = state.lineupMode[team.id] ?? "manual";
    Object.entries(teamLineup).forEach(([categoryKey, playerName]) => {
      const round = ROUNDS.find((r) => r.key === categoryKey);
      lineupChoices.push({
        teamKey: team.id,
        teamName: team.name,
        categoryKey,
        categoryTitle: round ? round.title.split(" — ")[0] : categoryKey,
        playerName,
        mode,
      });
    });
  });

  const difficultyPicks = state.difficultyLog.map((entry) => ({
    teamKey: entry.teamId,
    teamName: entry.teamName,
    playerName: entry.player,
    roundTitle: entry.round,
    difficulty: entry.difficulty,
  }));

  return { numRounds: state.numRounds, teams, lineupChoices, difficultyPicks };
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
