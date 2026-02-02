import { useGameStore } from './stores/gameStore';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';
import { SoundTest } from './components/SoundTest';
import { useSoundInit } from './audio';

export default function App() {
  const screen = useGameStore((state) => state.screen);

  // Initialize sound system on first user interaction
  useSoundInit();

  return (
    <div className="container">
      {screen === 'menu' && <MainMenu />}
      {screen === 'lobby' && <Lobby />}
      {screen === 'game' && <Game />}
      {screen === 'soundTest' && <SoundTest />}
    </div>
  );
}
