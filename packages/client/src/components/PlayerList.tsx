import { useGameStore } from '../stores/gameStore';
import type { Player } from '@circuit-chaos/shared';
import styles from './PlayerList.module.css';

export function PlayerList() {
  const { gameState, playerId } = useGameStore();

  if (!gameState) return null;

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
}

function PlayerListItem({ player, isCurrentPlayer, isHost }: PlayerListItemProps) {
  const { robot } = player;

  return (
    <li className={`${styles.player} ${!player.isConnected ? styles.disconnected : ''}`}>
      <span
        className={styles.color}
        style={{ backgroundColor: player.color }}
      />
      <div className={styles.info}>
        <span className={styles.name}>
          {player.name}
          {isHost && <span className={styles.badge}>Host</span>}
          {isCurrentPlayer && <span className={styles.badge}>You</span>}
        </span>
        <span className={styles.status}>
          {!player.isConnected ? (
            <span className={styles.offline}>Disconnected</span>
          ) : player.isReady ? (
            <span className={styles.ready}>Ready</span>
          ) : (
            <span className={styles.programming}>Programming...</span>
          )}
        </span>
      </div>
      <div className={styles.stats}>
        <span className={styles.checkpoint}>CP {robot.lastCheckpoint}</span>
        <span className={styles.damage}>{robot.damage} dmg</span>
      </div>
    </li>
  );
}
