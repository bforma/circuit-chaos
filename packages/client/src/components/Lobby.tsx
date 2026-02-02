import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { ThemeSelector } from './ThemeSelector';
import { useGameSounds } from '../audio';
import type { AIDifficulty } from '@circuit-chaos/shared';
import styles from './Lobby.module.css';

export function Lobby() {
  const { gameState, playerId } = useGameStore();
  const { startGame, leaveGame, setTheme, setCardPreview, addAIPlayer, removeAIPlayer } = useSocket();
  const { playGameStart } = useGameSounds();
  const [selectedDifficulty, setSelectedDifficulty] = useState<AIDifficulty>('medium');

  const handleStartGame = () => {
    playGameStart();
    startGame();
  };

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
                {player.isAI && <span className={styles.aiIndicator}>🤖</span>}
                {player.name}
                {player.isAI && player.aiDifficulty && (
                  <span className={styles.difficulty}>
                    ({player.aiDifficulty})
                  </span>
                )}
                {player.id === gameState.hostId && ' (Host)'}
                {player.id === playerId && ' (You)'}
              </span>
              {!player.isConnected && !player.isAI && (
                <span className={styles.disconnected}>Disconnected</span>
              )}
              {player.isAI && isHost && (
                <button
                  className={styles.removeAI}
                  onClick={() => removeAIPlayer(player.id)}
                  title="Remove AI"
                >
                  ✕
                </button>
              )}
            </li>
          ))}
        </ul>

        {isHost && gameState.players.length < gameState.maxPlayers && (
          <div className={styles.aiControls}>
            <select
              value={selectedDifficulty}
              onChange={(e) => setSelectedDifficulty(e.target.value as AIDifficulty)}
              className={styles.difficultySelect}
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <button
              className={styles.addAI}
              onClick={() => addAIPlayer(selectedDifficulty)}
            >
              + Add AI
            </button>
          </div>
        )}
      </div>

      <ThemeSelector
        selectedTheme={gameState.theme}
        onThemeChange={setTheme}
        disabled={!isHost}
      />

      <div className={styles.settings}>
        <label className={styles.settingRow}>
          <input
            type="checkbox"
            checked={gameState.cardPreviewEnabled}
            onChange={(e) => setCardPreview(e.target.checked)}
            disabled={!isHost}
          />
          <span>Card preview (show ghost when hovering cards)</span>
        </label>
      </div>

      <div className={styles.actions}>
        {isHost ? (
          <button
            className="btn btn-primary"
            onClick={handleStartGame}
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
