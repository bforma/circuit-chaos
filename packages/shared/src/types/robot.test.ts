import { describe, it, expect } from 'vitest';
import {
  createRobot,
  getHandSize,
  getLockedRegisterCount,
  isRobotDestroyed
} from './robot';
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

describe('getHandSize', () => {
  it('returns 9 cards at 0 damage', () => {
    expect(getHandSize(0)).toBe(9);
  });

  it('reduces hand size by damage amount', () => {
    expect(getHandSize(1)).toBe(8);
    expect(getHandSize(5)).toBe(4);
    expect(getHandSize(9)).toBe(0);
  });

  it('never returns negative', () => {
    expect(getHandSize(10)).toBe(0);
    expect(getHandSize(15)).toBe(0);
  });
});

describe('getLockedRegisterCount', () => {
  it('returns 0 locked registers at low damage', () => {
    expect(getLockedRegisterCount(0)).toBe(0);
    expect(getLockedRegisterCount(4)).toBe(0);
  });

  it('locks registers starting at 5 damage', () => {
    expect(getLockedRegisterCount(5)).toBe(1);
    expect(getLockedRegisterCount(6)).toBe(2);
    expect(getLockedRegisterCount(7)).toBe(3);
    expect(getLockedRegisterCount(8)).toBe(4);
    expect(getLockedRegisterCount(9)).toBe(5);
  });
});

describe('isRobotDestroyed', () => {
  it('returns false below 10 damage', () => {
    expect(isRobotDestroyed(0)).toBe(false);
    expect(isRobotDestroyed(9)).toBe(false);
  });

  it('returns true at 10+ damage', () => {
    expect(isRobotDestroyed(10)).toBe(true);
    expect(isRobotDestroyed(15)).toBe(true);
  });
});
