import type { Direction } from './direction';
import { STARTING_LIVES, STARTING_ENERGY } from '../constants';

export interface Position {
  x: number;
  y: number;
}

export interface Robot {
  id: string;
  playerId: string;
  position: Position;
  direction: Direction;
  damage: number;
  lives: number;
  lastCheckpoint: number;
  isDestroyed: boolean;
  spawnPosition: Position;
  isPoweredDown: boolean;      // Currently powered down this round
  willPowerDown: boolean;      // Announced power down for next round
  energy: number;              // Energy for upgrades (0-10, 2023 rules)
}

export function createRobot(playerId: string, spawnPosition: Position): Robot {
  return {
    id: crypto.randomUUID(),
    playerId,
    position: { ...spawnPosition },
    direction: 'north',
    damage: 0,
    lives: STARTING_LIVES,
    lastCheckpoint: 0,
    isDestroyed: false,
    spawnPosition: { ...spawnPosition },
    isPoweredDown: false,
    willPowerDown: false,
    energy: STARTING_ENERGY,
  };
}

