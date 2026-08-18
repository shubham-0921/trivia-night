export type TeamId = string;

export interface Team {
  id: TeamId;
  name: string;
  color: string; // css var name, e.g. "--t1"
  members: string[];
}

export type DiffKey = "easy" | "medium" | "hard";

export interface DiffLevel {
  key: DiffKey;
  label: string;
  points: number;
  desc: string;
}

export interface TextQuestion {
  kicker: string;
  prompt: string;
  answer: string;
  finale?: boolean;
  tough?: boolean;
  flag?: undefined;
}

export interface FlagQuestion {
  flag: string;
  hints: string[];
  answer: string;
  kicker?: undefined;
  prompt?: undefined;
  finale?: boolean;
  tough?: boolean;
}

export type Question = TextQuestion | FlagQuestion;

export interface RoundDef {
  key: string;
  icon: string;
  title: string;
  budget: string;
  questions: Question[];
}

export interface RoundGroup {
  title: string;
  roundIndexes: number[];
}

export type Screen = "setup" | "reveal" | "lineup" | "game" | "end";

export interface DifficultyLogEntry {
  teamId: TeamId;
  teamName: string;
  player: string;
  round: string;
  difficulty: DiffKey;
}
