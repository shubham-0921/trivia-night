"use client";

import { createContext, useContext, useEffect, useReducer } from "react";
import { Action, GameState, gameReducer, initialState } from "@/lib/gameReducer";

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(gameReducer, undefined, initialState);

  // Global 45:00 countdown — ticks once a second whenever running, regardless of screen.
  useEffect(() => {
    if (!state.globalTimerRunning) return;
    const id = setInterval(() => dispatch({ type: "TICK_GLOBAL_TIMER" }), 1000);
    return () => clearInterval(id);
  }, [state.globalTimerRunning]);

  // Per-question 30s countdown — ticks once a second whenever running.
  useEffect(() => {
    if (!state.qTimerRunning) return;
    const id = setInterval(() => dispatch({ type: "TICK_Q_TIMER" }), 1000);
    return () => clearInterval(id);
  }, [state.qTimerRunning]);

  return <GameContext.Provider value={{ state, dispatch }}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
