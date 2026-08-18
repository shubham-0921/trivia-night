import {
  DEFAULT_TEAMS,
  DIFF_LEVELS,
  ROUNDS,
  ROUND_GROUPS,
  TEAM_COLORS,
  TURNS_PER_ROUND,
  homeTeamOf,
} from "./data";
import type {
  DiffKey,
  DifficultyLogEntry,
  LineupMode,
  Question,
  Screen,
  Team,
  TeamId,
} from "./types";

export interface TurnInfo {
  teamId: TeamId;
  teamName: string;
  teamColor: string;
  name: string;
}

export interface GameState {
  screen: Screen;
  numRounds: number; // how many of the ROUND_GROUPS to play, chosen before the game starts

  // roster / teams
  teams: Team[];
  pool: string[];
  attendance: Record<string, boolean>;
  captains: Record<TeamId, string>;
  selectedChip: string | null;

  // category draft: which player each team maps to each category. Turn order within a
  // team is otherwise fixed to its roster position — never a choice.
  lineup: Record<TeamId, Record<string, string>>;
  lineupMode: Record<TeamId, LineupMode>;
  lineupTeamIndex: number;

  // active game
  activeQuestions: Question[][];
  currentRound: number;
  currentQ: number;
  revealedAnswers: Record<string, boolean>;
  hintsShown: Record<string, number>;
  turnDifficulty: Record<string, DiffKey>;
  scores: Record<TeamId, number>;
  difficultyChoices: Record<TeamId, Record<DiffKey, number>>;
  difficultyLog: DifficultyLogEntry[];

  // timers
  globalTimerSeconds: number;
  globalTimerRunning: boolean;
  qTimerKey: string | null;
  qTimerSeconds: number;
  qTimerRunning: boolean;
}

export const GLOBAL_TIMER_START = 45 * 60;
export const Q_TIMER_START = 30;

function freshAttendance(): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  DEFAULT_TEAMS.forEach((t) => t.members.forEach((n) => (out[n] = true)));
  return out;
}

export function qKeyOf(round: number, q: number): string {
  return `${round}-${q}`;
}

export function activeRoundIndexCount(state: GameState): number {
  return state.numRounds * 2;
}

export function initialState(): GameState {
  return {
    screen: "setup",
    numRounds: ROUND_GROUPS.length,
    teams: DEFAULT_TEAMS.map((t) => ({ ...t, members: [...t.members] })),
    pool: [],
    attendance: freshAttendance(),
    captains: {},
    selectedChip: null,

    lineup: {},
    lineupMode: {},
    lineupTeamIndex: 0,

    activeQuestions: [],
    currentRound: 0,
    currentQ: 0,
    revealedAnswers: {},
    hintsShown: {},
    turnDifficulty: {},
    scores: {},
    difficultyChoices: {},
    difficultyLog: [],

    globalTimerSeconds: GLOBAL_TIMER_START,
    globalTimerRunning: false,
    qTimerKey: null,
    qTimerSeconds: Q_TIMER_START,
    qTimerRunning: false,
  };
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// The opening of every round should come out swinging: the first TOUGH_OPENER_COUNT
// turns are always drawn from questions tagged `tough`, so the game starts hard no
// matter how the rest of the pool gets shuffled in behind them.
const TOUGH_OPENER_COUNT = 6;

function buildActiveQuestionSets(): Question[][] {
  return ROUNDS.map((round) => {
    const finale = round.questions.filter((q) => q.finale);
    const tough = round.questions.filter((q) => q.tough && !q.finale);
    const rest = round.questions.filter((q) => !q.tough && !q.finale);

    const openers = shuffle(tough).slice(0, TOUGH_OPENER_COUNT);
    const openerSet = new Set(openers);
    const remainingPool = [...tough.filter((q) => !openerSet.has(q)), ...rest];
    const fillerCount = Math.max(0, TURNS_PER_ROUND - finale.length - openers.length);
    const filler = shuffle(remainingPool).slice(0, fillerCount);

    return [...openers, ...filler, ...finale];
  });
}

export function getRoundQuestions(state: GameState, roundIndex: number): Question[] {
  return state.activeQuestions[roundIndex] ?? ROUNDS[roundIndex].questions;
}

// Whose turn it is: teams cycle in order (t1,t2,t3,...) every question, and within a
// round the team's answer always comes from whichever player they mapped to that
// round's category on the Lineup screen.
export function getTurnFor(state: GameState, roundIndex: number, qIndex: number): TurnInfo {
  const team = state.teams[qIndex % state.teams.length];
  const round = ROUNDS[roundIndex];
  const player = state.lineup[team.id]?.[round.key] || team.members[0] || "TBD";
  return { teamId: team.id, teamName: team.name, teamColor: team.color, name: player };
}

export type Action =
  // setup / roster
  | { type: "TOGGLE_ATTENDANCE"; name: string }
  | { type: "SELECT_POOL_CHIP"; name: string | null }
  | { type: "ASSIGN_SELECTED_TO_TEAM"; teamId: TeamId }
  | { type: "REMOVE_FROM_TEAM"; teamId: TeamId; name: string }
  | { type: "RENAME_TEAM"; teamId: TeamId; name: string }
  | { type: "ADD_TEAM" }
  | { type: "TOGGLE_CAPTAIN"; teamId: TeamId; name: string }
  | { type: "SET_NUM_ROUNDS"; numRounds: number }
  | { type: "GO_TO_REVEAL" }
  | { type: "GO_TO_LINEUP" }
  // category draft lineup screen
  | { type: "SET_LINEUP_TEAM_INDEX"; index: number }
  | { type: "SET_LINEUP_MODE"; teamId: TeamId; mode: LineupMode }
  | { type: "CHANGE_LINEUP_MODE"; teamId: TeamId }
  | { type: "SET_LINEUP_ASSIGNMENT"; teamId: TeamId; roundKey: string; player: string }
  | { type: "CLEAR_LINEUP_ASSIGNMENT"; teamId: TeamId; roundKey: string }
  | { type: "RANDOMIZE_TEAM_LINEUP"; teamId: TeamId }
  | { type: "CONFIRM_LINEUP_AND_START" }
  // game
  | { type: "SELECT_DIFFICULTY"; diff: DiffKey }
  | { type: "REVEAL_NEXT_HINT" }
  | { type: "TOGGLE_ANSWER" }
  | { type: "SCORE_DELTA"; teamId: TeamId; delta: number }
  | { type: "NEXT_TURN" }
  | { type: "PREV_TURN" }
  | { type: "JUMP_TO_ROUND"; roundIndex: number }
  | { type: "TOGGLE_GLOBAL_TIMER" }
  | { type: "RESET_GLOBAL_TIMER" }
  | { type: "TICK_GLOBAL_TIMER" }
  | { type: "RESTART_Q_TIMER" }
  | { type: "TICK_Q_TIMER" }
  | { type: "FINISH_GAME" }
  | { type: "RESTART_TO_SETUP" };

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "TOGGLE_ATTENDANCE": {
      const { name } = action;
      const nowPresent = !state.attendance[name];
      const attendance = { ...state.attendance, [name]: nowPresent };

      if (!nowPresent) {
        const teams = state.teams.map((t) => ({ ...t, members: t.members.filter((n) => n !== name) }));
        const captains = { ...state.captains };
        teams.forEach((t) => {
          if (captains[t.id] === name) delete captains[t.id];
        });
        return {
          ...state,
          attendance,
          teams,
          pool: state.pool.filter((n) => n !== name),
          selectedChip: state.selectedChip === name ? null : state.selectedChip,
          captains,
        };
      }

      const homeId = homeTeamOf(name);
      const alreadyPlaced =
        state.teams.some((t) => t.members.includes(name)) || state.pool.includes(name);
      if (!homeId || alreadyPlaced) return { ...state, attendance };
      const teams = state.teams.map((t) => (t.id === homeId ? { ...t, members: [...t.members, name] } : t));
      return { ...state, attendance, teams };
    }

    case "SELECT_POOL_CHIP":
      return { ...state, selectedChip: state.selectedChip === action.name ? null : action.name };

    case "ASSIGN_SELECTED_TO_TEAM": {
      if (!state.selectedChip) return state;
      const name = state.selectedChip;
      const teams = state.teams.map((t) =>
        t.id === action.teamId ? { ...t, members: [...t.members, name] } : t
      );
      return { ...state, teams, pool: state.pool.filter((n) => n !== name), selectedChip: null };
    }

    case "REMOVE_FROM_TEAM": {
      const { teamId, name } = action;
      const teams = state.teams.map((t) =>
        t.id === teamId ? { ...t, members: t.members.filter((n) => n !== name) } : t
      );
      const captains = { ...state.captains };
      if (captains[teamId] === name) delete captains[teamId];
      return { ...state, teams, pool: [...state.pool, name], captains };
    }

    case "RENAME_TEAM": {
      const teams = state.teams.map((t) => (t.id === action.teamId ? { ...t, name: action.name } : t));
      return { ...state, teams };
    }

    case "ADD_TEAM": {
      const idx = state.teams.length;
      if (idx >= TEAM_COLORS.length) return state;
      const teams = [...state.teams, { id: `t${idx + 1}`, name: `Team ${idx + 1}`, color: TEAM_COLORS[idx], members: [] }];
      return { ...state, teams };
    }

    case "TOGGLE_CAPTAIN": {
      const { teamId, name } = action;
      const captains = { ...state.captains };
      if (captains[teamId] === name) delete captains[teamId];
      else captains[teamId] = name;
      return { ...state, captains };
    }

    case "SET_NUM_ROUNDS": {
      const numRounds = Math.min(ROUND_GROUPS.length, Math.max(1, action.numRounds));
      return { ...state, numRounds };
    }

    case "GO_TO_REVEAL":
      return { ...state, screen: "reveal" };

    case "GO_TO_LINEUP":
      return { ...state, screen: "lineup", lineupTeamIndex: 0, lineupMode: {} };

    case "SET_LINEUP_TEAM_INDEX":
      return { ...state, lineupTeamIndex: action.index };

    case "SET_LINEUP_MODE": {
      const lineupMode = { ...state.lineupMode, [action.teamId]: action.mode };
      const lineup = action.mode === "random" ? randomizeLineupFor(state, action.teamId) : state.lineup;
      return { ...state, lineupMode, lineup };
    }

    case "CHANGE_LINEUP_MODE": {
      const lineupMode = { ...state.lineupMode };
      delete lineupMode[action.teamId];
      return { ...state, lineupMode };
    }

    case "SET_LINEUP_ASSIGNMENT": {
      const teamLineup = { ...(state.lineup[action.teamId] ?? {}), [action.roundKey]: action.player };
      return { ...state, lineup: { ...state.lineup, [action.teamId]: teamLineup } };
    }

    case "CLEAR_LINEUP_ASSIGNMENT": {
      const teamLineup = { ...(state.lineup[action.teamId] ?? {}) };
      delete teamLineup[action.roundKey];
      return { ...state, lineup: { ...state.lineup, [action.teamId]: teamLineup } };
    }

    case "RANDOMIZE_TEAM_LINEUP":
      return { ...state, lineup: randomizeLineupFor(state, action.teamId) };

    case "CONFIRM_LINEUP_AND_START": {
      const scores: Record<TeamId, number> = {};
      const difficultyChoices: Record<TeamId, Record<DiffKey, number>> = {};
      state.teams.forEach((t) => {
        scores[t.id] = 0;
        difficultyChoices[t.id] = { easy: 0, medium: 0, hard: 0 };
      });
      return {
        ...state,
        screen: "game",
        activeQuestions: buildActiveQuestionSets(),
        currentRound: 0,
        currentQ: 0,
        revealedAnswers: {},
        hintsShown: {},
        turnDifficulty: {},
        scores,
        difficultyChoices,
        difficultyLog: [],
        globalTimerSeconds: GLOBAL_TIMER_START,
        globalTimerRunning: false,
        qTimerKey: null,
        qTimerSeconds: Q_TIMER_START,
        qTimerRunning: false,
      };
    }

    case "SELECT_DIFFICULTY": {
      const key = qKeyOf(state.currentRound, state.currentQ);
      const turn = getTurnFor(state, state.currentRound, state.currentQ);
      const level = DIFF_LEVELS.find((d) => d.key === action.diff)!;
      const teamCounts = { ...(state.difficultyChoices[turn.teamId] ?? { easy: 0, medium: 0, hard: 0 }) };
      teamCounts[level.key] = (teamCounts[level.key] ?? 0) + 1;
      const logEntry: DifficultyLogEntry = {
        teamId: turn.teamId,
        teamName: turn.teamName,
        player: turn.name,
        round: ROUNDS[state.currentRound].title.split(" — ")[0],
        difficulty: level.key,
      };
      return {
        ...state,
        turnDifficulty: { ...state.turnDifficulty, [key]: action.diff },
        difficultyChoices: { ...state.difficultyChoices, [turn.teamId]: teamCounts },
        difficultyLog: [...state.difficultyLog, logEntry],
        qTimerKey: key,
        qTimerSeconds: Q_TIMER_START,
        qTimerRunning: true,
      };
    }

    case "REVEAL_NEXT_HINT": {
      const key = `${qKeyOf(state.currentRound, state.currentQ)}-hints`;
      const shown = (state.hintsShown[key] ?? 0) + 1;
      return { ...state, hintsShown: { ...state.hintsShown, [key]: shown } };
    }

    case "TOGGLE_ANSWER": {
      const key = qKeyOf(state.currentRound, state.currentQ);
      const nowShown = !state.revealedAnswers[key];
      return {
        ...state,
        revealedAnswers: { ...state.revealedAnswers, [key]: nowShown },
        qTimerRunning: nowShown ? false : state.qTimerRunning,
      };
    }

    case "SCORE_DELTA": {
      const scores = { ...state.scores, [action.teamId]: (state.scores[action.teamId] ?? 0) + action.delta };
      return { ...state, scores };
    }

    case "PREV_TURN": {
      let { currentRound, currentQ } = state;
      if (currentQ > 0) currentQ -= 1;
      else if (currentRound > 0) {
        currentRound -= 1;
        currentQ = getRoundQuestions(state, currentRound).length - 1;
      }
      return {
        ...state,
        currentRound,
        currentQ,
        qTimerKey: null,
        qTimerRunning: false,
        qTimerSeconds: Q_TIMER_START,
      };
    }

    case "NEXT_TURN": {
      const roundQuestions = getRoundQuestions(state, state.currentRound);
      const isLastQ = state.currentQ === roundQuestions.length - 1;
      const isLastRound = state.currentRound === activeRoundIndexCount(state) - 1;
      if (isLastQ && isLastRound) return { ...state, screen: "end" };
      let { currentRound, currentQ } = state;
      if (!isLastQ) currentQ += 1;
      else {
        currentRound += 1;
        currentQ = 0;
      }
      return {
        ...state,
        currentRound,
        currentQ,
        qTimerKey: null,
        qTimerRunning: false,
        qTimerSeconds: Q_TIMER_START,
      };
    }

    case "JUMP_TO_ROUND":
      return {
        ...state,
        currentRound: action.roundIndex,
        currentQ: 0,
        qTimerKey: null,
        qTimerRunning: false,
        qTimerSeconds: Q_TIMER_START,
      };

    case "TOGGLE_GLOBAL_TIMER":
      return { ...state, globalTimerRunning: !state.globalTimerRunning };

    case "RESET_GLOBAL_TIMER":
      return { ...state, globalTimerRunning: false, globalTimerSeconds: GLOBAL_TIMER_START };

    case "TICK_GLOBAL_TIMER": {
      if (!state.globalTimerRunning) return state;
      if (state.globalTimerSeconds <= 1) {
        return { ...state, globalTimerSeconds: 0, globalTimerRunning: false, screen: "end" };
      }
      return { ...state, globalTimerSeconds: state.globalTimerSeconds - 1 };
    }

    case "RESTART_Q_TIMER":
      return {
        ...state,
        qTimerKey: qKeyOf(state.currentRound, state.currentQ),
        qTimerSeconds: Q_TIMER_START,
        qTimerRunning: true,
      };

    case "TICK_Q_TIMER": {
      if (!state.qTimerRunning) return state;
      if (state.qTimerSeconds <= 1) return { ...state, qTimerSeconds: 0, qTimerRunning: false };
      return { ...state, qTimerSeconds: state.qTimerSeconds - 1 };
    }

    case "FINISH_GAME":
      return { ...state, screen: "end" };

    case "RESTART_TO_SETUP":
      return {
        ...state,
        screen: "setup",
        currentRound: 0,
        currentQ: 0,
        revealedAnswers: {},
        hintsShown: {},
        lineup: {},
        lineupMode: {},
        lineupTeamIndex: 0,
        turnDifficulty: {},
        difficultyChoices: {},
        difficultyLog: [],
        globalTimerRunning: false,
        globalTimerSeconds: GLOBAL_TIMER_START,
        qTimerKey: null,
        qTimerRunning: false,
        qTimerSeconds: Q_TIMER_START,
      };

    default:
      return state;
  }
}

function randomizeLineupFor(state: GameState, teamId: TeamId): GameState["lineup"] {
  const team = state.teams.find((t) => t.id === teamId);
  if (!team || team.members.length === 0) return state.lineup;
  const teamLineup = { ...(state.lineup[teamId] ?? {}) };
  ROUNDS.slice(0, activeRoundIndexCount(state)).forEach((round) => {
    teamLineup[round.key] = team.members[Math.floor(Math.random() * team.members.length)];
  });
  return { ...state.lineup, [teamId]: teamLineup };
}
