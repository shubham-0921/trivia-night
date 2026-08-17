const TEAM_KEY_COLOR: Record<string, string> = {
  t1: "--t1",
  t2: "--t2",
  t3: "--t3",
  t4: "--t4",
  t5: "--t5",
};

export function teamColorVar(teamKey: string): string {
  return TEAM_KEY_COLOR[teamKey] ?? "--accent";
}
