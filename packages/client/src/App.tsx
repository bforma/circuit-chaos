import { useGameStore } from './stores/gameStore';
import { MainMenu } from './components/MainMenu';
import { Lobby } from './components/Lobby';
import { Game } from './components/Game';

export default function App() {
  const screen = useGameStore((state) => state.screen);

  return (
    <div className="container">
      {screen === 'menu' && <MainMenu />}
      {screen === 'lobby' && <Lobby />}
      {screen === 'game' && <Game />}
    </div>
  );
}
