"use client";

import { GameProvider, useGame } from "@/context/GameContext";
import { SetupScreen } from "@/components/screens/SetupScreen";
import { RevealScreen } from "@/components/screens/RevealScreen";
import { LineupScreen } from "@/components/screens/LineupScreen";
import { GameScreen } from "@/components/screens/GameScreen";
import { EndScreen } from "@/components/screens/EndScreen";

function Screens() {
  const { state } = useGame();
  switch (state.screen) {
    case "setup":
      return <SetupScreen />;
    case "reveal":
      return <RevealScreen />;
    case "lineup":
      return <LineupScreen />;
    case "game":
      return <GameScreen />;
    case "end":
      return <EndScreen />;
  }
}

export default function Home() {
  return (
    <GameProvider>
      <Screens />
    </GameProvider>
  );
}
