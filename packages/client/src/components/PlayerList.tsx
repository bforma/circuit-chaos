import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { DISCONNECT_VOTE_DELAY_MS } from '@circuit-chaos/shared';
import type { Player } from '@circuit-chaos/shared';
import styles from './PlayerList.module.css';

export function PlayerList() {
  const { gameState, playerId } = useGameStore();

  if (!gameState) return null;

  const isInGame = gameState.phase !== 'lobby';

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Players</h3>
      <ul className={styles.list}>
        {gameState.players.map((player) => (
          <PlayerListItem
            key={player.id}
            player={player}
            isCurrentPlayer={player.id === playerId}
            isHost={player.id === gameState.hostId}
            hasPriority={player.id === gameState.priorityPlayerId}
            showVoteCountdown={isInGame}
          />
        ))}
      </ul>
    </div>
  );
}

interface PlayerListItemProps {
  player: Player;
  isCurrentPlayer: boolean;
  isHost: boolean;
  hasPriority: boolean;
  showVoteCountdown: boolean;
}

function PlayerListItem({ player, isCurrentPlayer, isHost, hasPriority, showVoteCountdown }: PlayerListItemProps) {
  const { robot } = player;
  const [voteCountdown, setVoteCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (!player.disconnectedAt || player.isConnected || !showVoteCountdown) {
      setVoteCountdown(null);
      return;
    }

    const updateCountdown = () => {
      const elapsed = Date.now() - player.disconnectedAt!;
      const remaining = Math.max(0, Math.ceil((DISCONNECT_VOTE_DELAY_MS - elapsed) / 1000));
      setVoteCountdown(remaining > 0 ? remaining : null);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [player.disconnectedAt, player.isConnected, showVoteCountdown]);

  return (
    <li className={`${styles.player} ${!player.isConnected ? styles.disconnected : ''}`}>
      <span
        className={styles.color}
        style={{ backgroundColor: player.color }}
      />
      <div className={styles.info}>
        <span className={styles.name}>
          {player.name}
          {player.isAI && <span className={styles.badge}>AI</span>}
          {isHost && <span className={styles.badge}>Host</span>}
          {isCurrentPlayer && <span className={styles.badge}>You</span>}
          {hasPriority && <span className={styles.priorityBadge} title="Priority Token - moves first">1st</span>}
        </span>
        <span className={styles.status}>
          {!player.isConnected ? (
            <span className={styles.offline}>
              Disconnected
              {voteCountdown !== null && (
                <span className={styles.voteCountdown}> (vote in {voteCountdown}s)</span>
              )}
            </span>
          ) : player.isReady ? (
            <span className={styles.ready}>Ready</span>
          ) : (
            <span className={styles.programming}>Programming...</span>
          )}
        </span>
      </div>
      <div className={styles.stats}>
        <span className={styles.checkpoint}>CP {robot.lastCheckpoint}</span>
      </div>
    </li>
  );
}
