import { describe, it, expect } from 'vitest';
import { calculatePreviewPosition } from './previewCalculator';
import type { Player, Board, Card } from '@circuit-chaos/shared';

function createTestBoard(): Board {
  const tiles: any[][] = [];
  for (let y = 0; y < 5; y++) {
    tiles[y] = [];
    for (let x = 0; x < 5; x++) {
      tiles[y][x] = { type: 'floor' };
    }
  }
  return {
    id: 'test-board',
    name: 'Test Board',
    width: 5,
    height: 5,
    tiles,
    walls: [],
    lasers: [],
    checkpoints: [],
    spawnPoints: [],
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
      position: { x: 2, y: 2 },
      direction: 'north',
      damage: 0,
      lives: 3,
      lastCheckpoint: 0,
      isDestroyed: false,
      spawnPosition: { x: 2, y: 2 },
      isPoweredDown: false,
      willPowerDown: false,
    },
  };
}

describe('calculatePreviewPosition', () => {
  it('simulates move1 card', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];

    const result = calculatePreviewPosition(player, board, cards);

    expect(result.x).toBe(2);
    expect(result.y).toBe(1); // Moved north
    expect(result.direction).toBe('north');
    expect(result.isDestroyed).toBe(false);
  });

  it('simulates move2 card', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    const cards: Card[] = [{ id: '1', type: 'move2', priority: 100 }];

    const result = calculatePreviewPosition(player, board, cards);

    expect(result.x).toBe(2);
    expect(result.y).toBe(0);
  });

  it('simulates rotation cards', () => {
    const player = createTestPlayer();
    const board = createTestBoard();

    const leftResult = calculatePreviewPosition(player, board, [
      { id: '1', type: 'rotateLeft', priority: 100 },
    ]);
    expect(leftResult.direction).toBe('west');

    const rightResult = calculatePreviewPosition(player, board, [
      { id: '1', type: 'rotateRight', priority: 100 },
    ]);
    expect(rightResult.direction).toBe('east');

    const uturnResult = calculatePreviewPosition(player, board, [
      { id: '1', type: 'uturn', priority: 100 },
    ]);
    expect(uturnResult.direction).toBe('south');
  });

  it('simulates backup card', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    const cards: Card[] = [{ id: '1', type: 'backup', priority: 100 }];

    const result = calculatePreviewPosition(player, board, cards);

    expect(result.x).toBe(2);
    expect(result.y).toBe(3); // Moved south (backward)
    expect(result.direction).toBe('north'); // Direction unchanged
  });

  it('simulates multiple cards in sequence', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    const cards: Card[] = [
      { id: '1', type: 'move1', priority: 100 },
      { id: '2', type: 'rotateRight', priority: 90 },
      { id: '3', type: 'move1', priority: 80 },
    ];

    const result = calculatePreviewPosition(player, board, cards);

    // Start at (2,2) north, move to (2,1), rotate to east, move to (3,1)
    expect(result.x).toBe(3);
    expect(result.y).toBe(1);
    expect(result.direction).toBe('east');
  });

  it('stops at walls', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    board.walls.push({ x: 2, y: 2, side: 'north' });

    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];
    const result = calculatePreviewPosition(player, board, cards);

    expect(result.x).toBe(2);
    expect(result.y).toBe(2); // Didn't move
  });

  it('marks destroyed when falling into pit', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    board.tiles[1][2] = { type: 'pit' };

    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];
    const result = calculatePreviewPosition(player, board, cards);

    expect(result.isDestroyed).toBe(true);
  });

  it('marks destroyed when moving off board', () => {
    const player = createTestPlayer();
    player.robot.position = { x: 2, y: 0 };
    const board = createTestBoard();

    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];
    const result = calculatePreviewPosition(player, board, cards);

    expect(result.isDestroyed).toBe(true);
  });

  it('handles null cards in sequence', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    const cards: (Card | null)[] = [
      { id: '1', type: 'move1', priority: 100 },
      null,
      { id: '2', type: 'move1', priority: 80 },
    ];

    const result = calculatePreviewPosition(player, board, cards);

    expect(result.y).toBe(0); // Moved twice north
  });

  it('applies conveyor effects', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    board.tiles[1][2] = { type: 'conveyor', direction: 'east', speed: 1 };

    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];
    const result = calculatePreviewPosition(player, board, cards);

    // Move north to (2,1), then conveyor pushes east to (3,1)
    expect(result.x).toBe(3);
    expect(result.y).toBe(1);
  });

  it('applies gear effects', () => {
    const player = createTestPlayer();
    const board = createTestBoard();
    board.tiles[1][2] = { type: 'gear', rotation: 'cw' };

    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];
    const result = calculatePreviewPosition(player, board, cards);

    expect(result.x).toBe(2);
    expect(result.y).toBe(1);
    expect(result.direction).toBe('east'); // Rotated clockwise
  });

  it('returns current position for destroyed robot', () => {
    const player = createTestPlayer();
    player.robot.isDestroyed = true;
    const board = createTestBoard();
    const cards: Card[] = [{ id: '1', type: 'move1', priority: 100 }];

    const result = calculatePreviewPosition(player, board, cards);

    expect(result.x).toBe(2);
    expect(result.y).toBe(2);
    expect(result.isDestroyed).toBe(true);
  });
});
