import { describe, it, expect } from 'vitest';
import { createEmptyBoard } from './board';

describe('createEmptyBoard', () => {
  it('creates a board with correct dimensions', () => {
    const board = createEmptyBoard(10, 8, 'Test Board');

    expect(board.width).toBe(10);
    expect(board.height).toBe(8);
    expect(board.name).toBe('Test Board');
  });

  it('fills all tiles with floor type', () => {
    const board = createEmptyBoard(5, 5);

    for (let y = 0; y < 5; y++) {
      for (let x = 0; x < 5; x++) {
        expect(board.tiles[y][x].type).toBe('floor');
      }
    }
  });

  it('initializes empty arrays for board elements', () => {
    const board = createEmptyBoard(3, 3);

    expect(board.walls).toEqual([]);
    expect(board.lasers).toEqual([]);
    expect(board.checkpoints).toEqual([]);
    expect(board.spawnPoints).toEqual([]);
  });

  it('generates unique board IDs', () => {
    const board1 = createEmptyBoard(5, 5);
    const board2 = createEmptyBoard(5, 5);

    expect(board1.id).not.toBe(board2.id);
  });
});
