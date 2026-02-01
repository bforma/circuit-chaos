import type { Player } from '@circuit-chaos/shared';
import { MAX_ENERGY } from '@circuit-chaos/shared';
import styles from './PlayerHUD.module.css';

interface Props {
  player: Player;
}

export function PlayerHUD({ player }: Props) {
  const { robot } = player;

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
        <span className={styles.label}>Energy</span>
        <div className={styles.energyBar}>
          <div
            className={styles.energyFill}
            style={{ width: `${(robot.energy / MAX_ENERGY) * 100}%` }}
          />
          <span className={styles.energyText}>{robot.energy}/{MAX_ENERGY}</span>
        </div>
      </div>
    </div>
  );
}
