import { useEffect, useRef } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { GameBoard } from '../game/GameBoard';
import { ProgrammingPanel } from './ProgrammingPanel';
import { PlayerHUD } from './PlayerHUD';
import { PlayerList } from './PlayerList';
import { DisconnectVoteModal } from './DisconnectVoteModal';
import { GameLog } from './GameLog';
import { useGameSounds } from '../audio';
import styles from './Game.module.css';

export function Game() {
  const { gameState, getCurrentPlayer, playerId } = useGameStore();
  const { playAgain } = useSocket();
  const { playGameWin } = useGameSounds();
  const currentPlayer = getCurrentPlayer();
  const isHost = playerId === gameState?.hostId;
  const prevPhaseRef = useRef<string | null>(null);

  // Play game win sound when game finishes
  useEffect(() => {
    if (gameState?.phase === 'finished' && prevPhaseRef.current !== 'finished') {
      playGameWin();
    }
    prevPhaseRef.current = gameState?.phase ?? null;
  }, [gameState?.phase, playGameWin]);

  if (!gameState || !currentPlayer) {
    return <div className={styles.loading}>Loading game...</div>;
  }

  return (
    <div className={styles.container}>
      {/* Left sidebar - Player info and controls */}
      <div className={styles.leftSidebar}>
        <PlayerList />
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
            {isHost && (
              <button className="btn btn-primary" onClick={playAgain}>
                Play Again
              </button>
            )}
            {!isHost && (
              <p className={styles.waitingHost}>Waiting for host to restart...</p>
            )}
          </div>
        )}
      </div>

      <div className={styles.gameArea}>
        <GameBoard board={gameState.board} players={gameState.players} theme={gameState.theme} />
      </div>

      {/* Right sidebar - Game Log */}
      <div className={styles.rightSidebar}>
        <GameLog />
      </div>

      <DisconnectVoteModal />
    </div>
  );
}
