import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { ThemeSelector } from './ThemeSelector';
import styles from './Lobby.module.css';

export function Lobby() {
  const { gameState, playerId } = useGameStore();
  const { startGame, leaveGame, setTheme } = useSocket();

  if (!gameState) {
    return <div className={styles.container}>Loading...</div>;
  }

  const isHost = gameState.hostId === playerId;
  const canStart = gameState.players.length >= 2;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Game Lobby</h2>
        <div className={styles.code}>
          Code: <span>{gameState.id}</span>
        </div>
      </div>

      <div className={styles.players}>
        <h3>Players ({gameState.players.length}/{gameState.maxPlayers})</h3>
        <ul>
          {gameState.players.map((player) => (
            <li key={player.id} className={styles.player}>
              <span
                className={styles.playerColor}
                style={{ backgroundColor: player.color }}
              />
              <span className={styles.playerName}>
                {player.name}
                {player.id === gameState.hostId && ' (Host)'}
                {player.id === playerId && ' (You)'}
              </span>
              {!player.isConnected && (
                <span className={styles.disconnected}>Disconnected</span>
              )}
            </li>
          ))}
        </ul>
      </div>

      <ThemeSelector
        selectedTheme={gameState.theme}
        onThemeChange={setTheme}
        disabled={!isHost}
      />

      <div className={styles.actions}>
        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={startGame}
            disabled={!canStart}
          >
            {canStart ? 'Start Game' : 'Need at least 2 players'}
          </button>
        ) : (
          <p className={styles.waiting}>Waiting for host to start...</p>
        )}
        <button className="btn btn-secondary" onClick={leaveGame}>
          Leave Game
        </button>
      </div>
    </div>
  );
}
