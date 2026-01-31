import { describe, it, expect } from 'vitest';
import { createPlayer, PLAYER_COLORS } from './player';

describe('createPlayer', () => {
  it('creates a player with correct basic properties', () => {
    const player = createPlayer('player-1', 'TestPlayer', 0);

    expect(player.id).toBe('player-1');
    expect(player.name).toBe('TestPlayer');
    expect(player.color).toBe(PLAYER_COLORS[0]);
    expect(player.hand).toEqual([]);
    expect(player.registers).toEqual([null, null, null, null, null]);
    expect(player.isReady).toBe(false);
    expect(player.isConnected).toBe(true);
  });

  it('assigns color based on index', () => {
    const player0 = createPlayer('p0', 'Player0', 0);
    const player1 = createPlayer('p1', 'Player1', 1);
    const player2 = createPlayer('p2', 'Player2', 2);

    expect(player0.color).toBe(PLAYER_COLORS[0]);
    expect(player1.color).toBe(PLAYER_COLORS[1]);
    expect(player2.color).toBe(PLAYER_COLORS[2]);
  });

  it('wraps color index when exceeding available colors', () => {
    const player = createPlayer('p8', 'Player8', 8);

    expect(player.color).toBe(PLAYER_COLORS[0]); // 8 % 8 = 0
  });

  describe('AI players', () => {
    it('creates non-AI player by default', () => {
      const player = createPlayer('p1', 'Human', 0);

      expect(player.isAI).toBe(false);
      expect(player.aiDifficulty).toBeUndefined();
    });

    it('creates AI player when isAI option is true', () => {
      const player = createPlayer('p1', 'Bot', 0, { isAI: true });

      expect(player.isAI).toBe(true);
    });

    it('sets AI difficulty when provided', () => {
      const easyBot = createPlayer('p1', 'EasyBot', 0, {
        isAI: true,
        aiDifficulty: 'easy',
      });
      const hardBot = createPlayer('p2', 'HardBot', 1, {
        isAI: true,
        aiDifficulty: 'hard',
      });

      expect(easyBot.aiDifficulty).toBe('easy');
      expect(hardBot.aiDifficulty).toBe('hard');
    });

    it('allows setting difficulty without isAI (edge case)', () => {
      const player = createPlayer('p1', 'Test', 0, {
        aiDifficulty: 'medium',
      });

      expect(player.isAI).toBe(false);
      expect(player.aiDifficulty).toBe('medium');
    });
  });
});
