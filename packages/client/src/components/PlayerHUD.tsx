import type { Player } from '@circuit-chaos/shared';
import { MAX_DAMAGE, STARTING_LIVES, MAX_ENERGY } from '@circuit-chaos/shared';
import styles from './PlayerHUD.module.css';

interface Props {
  player: Player;
}

export function PlayerHUD({ player }: Props) {
  const { robot } = player;
  const healthPercent = ((MAX_DAMAGE - robot.damage) / MAX_DAMAGE) * 100;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span
          className={styles.playerColor}
          style={{ backgroundColor: player.color }}
        />
        <span className={styles.playerName}>{player.name}</span>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>Damage</span>
        <div className={styles.healthBar}>
          <div
            className={styles.healthFill}
            style={{
              width: `${healthPercent}%`,
              backgroundColor: healthPercent > 50 ? '#2ecc71' : healthPercent > 25 ? '#f39c12' : '#e74c3c'
            }}
          />
          <span className={styles.healthText}>{robot.damage}/{MAX_DAMAGE}</span>
        </div>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>Lives</span>
        <div className={styles.lives}>
          {Array.from({ length: STARTING_LIVES }).map((_, i) => (
            <span
              key={i}
              className={`${styles.life} ${i < robot.lives ? styles.lifeActive : ''}`}
            >
              ●
            </span>
          ))}
        </div>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>Checkpoint</span>
        <span className={styles.value}>{robot.lastCheckpoint}</span>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>Direction</span>
        <span className={styles.value}>{robot.direction}</span>
      </div>

      <div className={styles.stat}>
        <span className={styles.label}>Energy</span>
        <span className={styles.energy}>{robot.energy}/{MAX_ENERGY}</span>
      </div>
    </div>
  );
}
