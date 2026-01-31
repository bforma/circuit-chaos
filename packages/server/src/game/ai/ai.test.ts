import { describe, it, expect } from 'vitest';
import { makeAIDecision } from './index';
import type { GameState, Player, Card, Board } from '@circuit-chaos/shared';

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
    checkpoints: [{ x: 3, y: 3, order: 1 }],
    spawnPoints: [{ x: 0, y: 0, order: 1 }],
  };
}

function createTestCards(): Card[] {
  return [
    { id: '1', type: 'move1', priority: 500 },
    { id: '2', type: 'move2', priority: 700 },
    { id: '3', type: 'move3', priority: 800 },
    { id: '4', type: 'rotateLeft', priority: 100 },
    { id: '5', type: 'rotateRight', priority: 150 },
    { id: '6', type: 'backup', priority: 450 },
    { id: '7', type: 'move1', priority: 520 },
    { id: '8', type: 'move1', priority: 540 },
    { id: '9', type: 'uturn', priority: 50 },
  ];
}

function createTestPlayer(overrides: Partial<Player> = {}): Player {
  return {
    id: 'test-player',
    name: 'TestBot',
    color: '#ff0000',
    hand: createTestCards(),
    registers: [null, null, null, null, null],
    isReady: false,
    isConnected: true,
    isAI: true,
    aiDifficulty: 'medium',
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
    ...overrides,
  };
}

function createTestState(player?: Player): GameState {
  const p = player ?? createTestPlayer();
  return {
    id: 'test-game',
    phase: 'programming',
    board: createTestBoard(),
    players: [p],
    currentRegister: 0,
    turn: 1,
    hostId: 'test-player',
    maxPlayers: 8,
    createdAt: Date.now(),
    theme: 'industrial',
    cardPreviewEnabled: true,
  };
}

describe('AI Decision Making', () => {
  describe('makeAIDecision', () => {
    it('fills all 5 registers', () => {
      const player = createTestPlayer();
      const state = createTestState(player);

      const decision = makeAIDecision(state, player);

      expect(decision.registers).toHaveLength(5);
      expect(decision.registers.every(r => r !== null)).toBe(true);
    });

    it('only uses cards from the players hand', () => {
      const player = createTestPlayer();
      const state = createTestState(player);
      const handIds = player.hand.map(c => c.id);

      const decision = makeAIDecision(state, player);

      for (const register of decision.registers) {
        if (register) {
          expect(handIds).toContain(register.id);
        }
      }
    });

    it('does not use the same card twice', () => {
      const player = createTestPlayer();
      const state = createTestState(player);

      const decision = makeAIDecision(state, player);

      const usedIds = decision.registers
        .filter((r): r is Card => r !== null)
        .map(r => r.id);
      const uniqueIds = new Set(usedIds);
      expect(usedIds.length).toBe(uniqueIds.size);
    });

    it('respects locked registers', () => {
      const lockedCard: Card = { id: 'locked', type: 'backup', priority: 100 };
      const player = createTestPlayer({
        registers: [null, null, null, null, lockedCard],
      });
      player.robot.damage = 5; // 1 locked register
      const state = createTestState(player);

      const decision = makeAIDecision(state, player);

      // Last register should remain as it was (locked)
      expect(decision.registers[4]).toEqual(lockedCard);
    });

    describe('easy difficulty', () => {
      it('never powers down', () => {
        const player = createTestPlayer({ aiDifficulty: 'easy' });
        player.robot.damage = 9; // Very high damage
        const state = createTestState(player);

        // Run multiple times to check probability
        for (let i = 0; i < 10; i++) {
          const decision = makeAIDecision(state, player);
          expect(decision.willPowerDown).toBe(false);
        }
      });
    });

    describe('medium difficulty', () => {
      it('may power down at high damage', () => {
        const player = createTestPlayer({ aiDifficulty: 'medium' });
        player.robot.damage = 7;
        const state = createTestState(player);

        // Run many times - should power down at least sometimes (30% chance)
        let poweredDown = false;
        for (let i = 0; i < 50; i++) {
          const decision = makeAIDecision(state, player);
          if (decision.willPowerDown) {
            poweredDown = true;
            break;
          }
        }
        // This could theoretically fail but is extremely unlikely
        expect(poweredDown).toBe(true);
      });

      it('does not power down at low damage', () => {
        const player = createTestPlayer({ aiDifficulty: 'medium' });
        player.robot.damage = 3;
        const state = createTestState(player);

        for (let i = 0; i < 10; i++) {
          const decision = makeAIDecision(state, player);
          expect(decision.willPowerDown).toBe(false);
        }
      });
    });

    describe('hard difficulty', () => {
      it('makes strategic power down decisions at very high damage', () => {
        const player = createTestPlayer({ aiDifficulty: 'hard' });
        player.robot.damage = 8;
        player.robot.position = { x: 0, y: 0 }; // Far from checkpoint
        const state = createTestState(player);

        const decision = makeAIDecision(state, player);

        // Hard AI should power down at 8 damage when far from checkpoint
        expect(decision.willPowerDown).toBe(true);
      });

      it('does not power down when near checkpoint even with high damage', () => {
        const player = createTestPlayer({ aiDifficulty: 'hard' });
        player.robot.damage = 8;
        player.robot.position = { x: 2, y: 3 }; // Near checkpoint at (3,3)
        const state = createTestState(player);

        const decision = makeAIDecision(state, player);

        // Should not power down when close to checkpoint
        expect(decision.willPowerDown).toBe(false);
      });
    });
  });

  describe('AI behavior consistency', () => {
    it('works with minimum hand size', () => {
      const player = createTestPlayer();
      player.hand = [
        { id: '1', type: 'move1', priority: 500 },
        { id: '2', type: 'move1', priority: 510 },
        { id: '3', type: 'move1', priority: 520 },
        { id: '4', type: 'move1', priority: 530 },
        { id: '5', type: 'move1', priority: 540 },
      ];
      const state = createTestState(player);

      const decision = makeAIDecision(state, player);

      expect(decision.registers).toHaveLength(5);
      expect(decision.registers.every(r => r !== null)).toBe(true);
    });

    it('handles player already powered down', () => {
      const player = createTestPlayer({ aiDifficulty: 'hard' });
      player.robot.isPoweredDown = true;
      player.robot.damage = 9;
      const state = createTestState(player);

      const decision = makeAIDecision(state, player);

      // Should still make a decision for registers
      expect(decision.registers).toHaveLength(5);
    });
  });
});
