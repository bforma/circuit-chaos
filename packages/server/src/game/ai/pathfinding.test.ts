import { describe, it, expect } from 'vitest';
import {
  distanceToCheckpoint,
  isHazard,
  isWallBlocking,
  simulateCard,
  evaluatePosition,
  simulateCardSequence,
} from './pathfinding';
import type { GameState, Player, Card, Board } from '@circuit-chaos/shared';

function createTestBoard(width = 5, height = 5): Board {
  const tiles: any[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = { type: 'floor' };
    }
  }
  return {
    id: 'test-board',
    name: 'Test Board',
    width,
    height,
    tiles,
    walls: [],
    lasers: [],
    checkpoints: [{ x: 3, y: 3, order: 1 }],
    spawnPoints: [{ x: 0, y: 0, order: 1 }],
  };
}

function createTestPlayer(): Player {
  return {
    id: 'test-player',
    name: 'Test',
    color: '#ff0000',
    hand: [],
    registers: [null, null, null, null, null],
    isReady: false,
    isConnected: true,
    isAI: false,
    robot: {
      id: 'test-robot',
      playerId: 'test-player',
      position: { x: 1, y: 1 },
      direction: 'north',
      damage: 0,
      lives: 3,
      lastCheckpoint: 0,
      isDestroyed: false,
      spawnPosition: { x: 0, y: 0 },
      isPoweredDown: false,
      willPowerDown: false,
    },
  };
}

function createTestState(board?: Board): GameState {
  return {
    id: 'test-game',
    phase: 'programming',
    board: board ?? createTestBoard(),
    players: [createTestPlayer()],
    currentRegister: 0,
    turn: 1,
    hostId: 'test-player',
    maxPlayers: 8,
    createdAt: Date.now(),
    theme: 'industrial',
    cardPreviewEnabled: true,
  };
}

describe('pathfinding', () => {
  describe('distanceToCheckpoint', () => {
    it('calculates Manhattan distance to next checkpoint', () => {
      const state = createTestState();
      // Player at (1,1), checkpoint at (3,3)
      const distance = distanceToCheckpoint({ x: 1, y: 1 }, state, 0);
      expect(distance).toBe(4); // |3-1| + |3-1| = 4
    });

    it('returns 0 when all checkpoints reached', () => {
      const state = createTestState();
      const distance = distanceToCheckpoint({ x: 1, y: 1 }, state, 1);
      expect(distance).toBe(0);
    });

    it('returns 0 when on checkpoint', () => {
      const state = createTestState();
      const distance = distanceToCheckpoint({ x: 3, y: 3 }, state, 0);
      expect(distance).toBe(0);
    });
  });

  describe('isHazard', () => {
    it('returns true for positions off the board', () => {
      const board = createTestBoard();
      expect(isHazard(board, -1, 0)).toBe(true);
      expect(isHazard(board, 0, -1)).toBe(true);
      expect(isHazard(board, 5, 0)).toBe(true);
      expect(isHazard(board, 0, 5)).toBe(true);
    });

    it('returns true for pit tiles', () => {
      const board = createTestBoard();
      board.tiles[2][2] = { type: 'pit' };
      expect(isHazard(board, 2, 2)).toBe(true);
    });

    it('returns false for floor tiles', () => {
      const board = createTestBoard();
      expect(isHazard(board, 1, 1)).toBe(false);
    });
  });

  describe('isWallBlocking', () => {
    it('returns true when wall blocks exit', () => {
      const board = createTestBoard();
      board.walls.push({ x: 1, y: 1, side: 'north' });
      expect(isWallBlocking(board, 1, 1, 'north')).toBe(true);
    });

    it('returns true when wall blocks entry', () => {
      const board = createTestBoard();
      board.walls.push({ x: 1, y: 0, side: 'south' });
      expect(isWallBlocking(board, 1, 1, 'north')).toBe(true);
    });

    it('returns false when no wall blocks', () => {
      const board = createTestBoard();
      expect(isWallBlocking(board, 1, 1, 'north')).toBe(false);
    });
  });

  describe('simulateCard', () => {
    it('simulates move1 card', () => {
      const state = createTestState();
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'move1', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
      expect(result.direction).toBe('north');
    });

    it('simulates move2 card', () => {
      const state = createTestState();
      const position = { x: 1, y: 2, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'move2', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
    });

    it('simulates move3 card', () => {
      const state = createTestState();
      const position = { x: 1, y: 3, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'move3', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.x).toBe(1);
      expect(result.y).toBe(0);
    });

    it('simulates backup card', () => {
      const state = createTestState();
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'backup', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.x).toBe(1);
      expect(result.y).toBe(2);
      expect(result.direction).toBe('north'); // Direction unchanged
    });

    it('simulates rotateLeft card', () => {
      const state = createTestState();
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'rotateLeft', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.direction).toBe('west');
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('simulates rotateRight card', () => {
      const state = createTestState();
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'rotateRight', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.direction).toBe('east');
    });

    it('simulates uturn card', () => {
      const state = createTestState();
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'uturn', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.direction).toBe('south');
    });

    it('stops at walls', () => {
      const board = createTestBoard();
      board.walls.push({ x: 1, y: 1, side: 'north' });
      const state = createTestState(board);
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'move1', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.x).toBe(1);
      expect(result.y).toBe(1); // Didn't move
    });

    it('marks destroyed when falling into pit', () => {
      const board = createTestBoard();
      board.tiles[0][1] = { type: 'pit' };
      const state = createTestState(board);
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'move1', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.isDestroyed).toBe(true);
    });

    it('marks destroyed when moving off board', () => {
      const state = createTestState();
      const position = { x: 0, y: 0, direction: 'north' as const, damage: 0, isDestroyed: false };
      const card: Card = { id: '1', type: 'move1', priority: 100 };

      const result = simulateCard(state, position, card);

      expect(result.isDestroyed).toBe(true);
    });
  });

  describe('evaluatePosition', () => {
    it('returns very negative score for destroyed position', () => {
      const state = createTestState();
      const player = state.players[0];
      const position = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: true };

      const score = evaluatePosition(state, position, player);

      expect(score).toBe(-1000);
    });

    it('gives bonus for reaching checkpoint', () => {
      const state = createTestState();
      const player = state.players[0];
      const onCheckpoint = { x: 3, y: 3, direction: 'north' as const, damage: 0, isDestroyed: false };
      const notOnCheckpoint = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };

      const scoreOn = evaluatePosition(state, onCheckpoint, player);
      const scoreOff = evaluatePosition(state, notOnCheckpoint, player);

      expect(scoreOn).toBeGreaterThan(scoreOff);
    });

    it('prefers positions closer to checkpoint', () => {
      const state = createTestState();
      const player = state.players[0];
      const closer = { x: 2, y: 2, direction: 'north' as const, damage: 0, isDestroyed: false };
      const farther = { x: 0, y: 0, direction: 'north' as const, damage: 0, isDestroyed: false };

      const scoreCloser = evaluatePosition(state, closer, player);
      const scoreFarther = evaluatePosition(state, farther, player);

      expect(scoreCloser).toBeGreaterThan(scoreFarther);
    });

    it('penalizes damage', () => {
      const state = createTestState();
      const player = state.players[0];
      const noDamage = { x: 1, y: 1, direction: 'north' as const, damage: 0, isDestroyed: false };
      const damaged = { x: 1, y: 1, direction: 'north' as const, damage: 5, isDestroyed: false };

      const scoreNoDamage = evaluatePosition(state, noDamage, player);
      const scoreDamaged = evaluatePosition(state, damaged, player);

      expect(scoreNoDamage).toBeGreaterThan(scoreDamaged);
    });
  });

  describe('simulateCardSequence', () => {
    it('simulates multiple cards in sequence', () => {
      const state = createTestState();
      const player = state.players[0];
      player.robot.position = { x: 2, y: 2 };
      player.robot.direction = 'north';

      const cards: Card[] = [
        { id: '1', type: 'move1', priority: 100 },
        { id: '2', type: 'rotateRight', priority: 90 },
        { id: '3', type: 'move1', priority: 80 },
      ];

      const result = simulateCardSequence(state, player, cards);

      // Start at (2,2) north, move to (2,1), rotate to east, move to (3,1)
      expect(result.x).toBe(3);
      expect(result.y).toBe(1);
      expect(result.direction).toBe('east');
    });

    it('stops simulating after destruction', () => {
      const board = createTestBoard();
      board.tiles[1][2] = { type: 'pit' };
      const state = createTestState(board);
      const player = state.players[0];
      player.robot.position = { x: 2, y: 2 };
      player.robot.direction = 'north';

      const cards: Card[] = [
        { id: '1', type: 'move1', priority: 100 }, // Move to pit at (2,1)
        { id: '2', type: 'move1', priority: 90 },  // Should not execute
      ];

      const result = simulateCardSequence(state, player, cards);

      expect(result.isDestroyed).toBe(true);
    });

    it('handles null cards in sequence', () => {
      const state = createTestState();
      const player = state.players[0];
      player.robot.position = { x: 2, y: 2 };
      player.robot.direction = 'north';

      const cards: (Card | null)[] = [
        { id: '1', type: 'move1', priority: 100 },
        null,
        { id: '2', type: 'move1', priority: 80 },
      ];

      const result = simulateCardSequence(state, player, cards);

      expect(result.y).toBe(0); // Moved twice north
    });
  });
});
