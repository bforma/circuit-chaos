import { describe, it, expect } from 'vitest';
import { createRobot } from './robot';
import { STARTING_LIVES } from '../constants';

describe('createRobot', () => {
  it('creates a robot with correct initial values', () => {
    const robot = createRobot('player-1', { x: 5, y: 10 });

    expect(robot.playerId).toBe('player-1');
    expect(robot.position).toEqual({ x: 5, y: 10 });
    expect(robot.direction).toBe('north');
    expect(robot.damage).toBe(0);
    expect(robot.lives).toBe(STARTING_LIVES);
    expect(robot.lastCheckpoint).toBe(0);
    expect(robot.isDestroyed).toBe(false);
    expect(robot.spawnPosition).toEqual({ x: 5, y: 10 });
  });

  it('creates unique robot IDs', () => {
    const robot1 = createRobot('p1', { x: 0, y: 0 });
    const robot2 = createRobot('p2', { x: 1, y: 1 });

    expect(robot1.id).not.toBe(robot2.id);
  });
});

