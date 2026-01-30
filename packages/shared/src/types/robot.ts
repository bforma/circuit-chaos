import type { Direction } from './direction';
import { MAX_DAMAGE, STARTING_LIVES } from '../constants';

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
  };
}

export function getHandSize(damage: number): number {
  // Start with 9 cards, lose 1 for each damage
  return Math.max(0, 9 - damage);
}

export function getLockedRegisterCount(damage: number): number {
  // Registers lock at 5+ damage
  // 5 damage = 1 locked, 6 = 2 locked, etc.
  return Math.max(0, damage - 4);
}

export function isRobotDestroyed(damage: number): boolean {
  return damage >= MAX_DAMAGE;
}
