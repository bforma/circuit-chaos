import { useGameStore } from '../stores/gameStore';
import { GameBoard } from '../game/GameBoard';
import { ProgrammingPanel } from './ProgrammingPanel';
import { PlayerHUD } from './PlayerHUD';
import styles from './Game.module.css';

export function Game() {
  const { gameState, getCurrentPlayer } = useGameStore();
  const currentPlayer = getCurrentPlayer();

  if (!gameState || !currentPlayer) {
    return <div className={styles.loading}>Loading game...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.gameArea}>
        <GameBoard board={gameState.board} players={gameState.players} />
      </div>

      <div className={styles.sidebar}>
        <PlayerHUD player={currentPlayer} />

        {gameState.phase === 'programming' && (
          <ProgrammingPanel />
        )}

        {gameState.phase === 'executing' && (
          <div className={styles.executing}>
            <p>Executing register {gameState.currentRegister + 1}...</p>
          </div>
        )}

        {gameState.phase === 'finished' && gameState.winnerId && (
          <div className={styles.winner}>
            <h2>Game Over!</h2>
            <p>
              Winner: {gameState.players.find(p => p.id === gameState.winnerId)?.name}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
