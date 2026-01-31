import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { GameManager } from './GameManager';
import { Card, REGISTERS_COUNT } from '@circuit-chaos/shared';

// Mock socket
function createMockSocket(id: string) {
  return {
    id,
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
  } as any;
}

// Mock io server with state capture
function createMockIO() {
  const emitFn = vi.fn();
  return {
    to: vi.fn(() => ({
      emit: emitFn,
    })),
    getLastState: () => {
      const stateCall = emitFn.mock.calls.find((c: any[]) => c[0] === 'game:state');
      return stateCall ? stateCall[1] : null;
    },
  } as any;
}

describe('GameManager', () => {
  let io: ReturnType<typeof createMockIO>;
  let gameManager: GameManager;

  beforeEach(() => {
    io = createMockIO();
    gameManager = new GameManager(io as unknown as Server);
  });

  describe('createGame', () => {
    it('creates a game and emits game:created', () => {
      const socket = createMockSocket('socket-1');

      gameManager.createGame(socket, 'TestPlayer');

      expect(socket.emit).toHaveBeenCalledWith(
        'game:created',
        expect.objectContaining({
          gameId: expect.any(String),
          playerId: expect.any(String),
        })
      );
      expect(socket.join).toHaveBeenCalled();
    });

    it('generates 4-character game IDs', () => {
      const socket = createMockSocket('socket-1');

      gameManager.createGame(socket, 'TestPlayer');

      const call = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      expect(call[1].gameId).toHaveLength(4);
    });
  });

  describe('joinGame', () => {
    it('allows joining an existing game', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      expect(guestSocket.emit).toHaveBeenCalledWith(
        'game:joined',
        expect.objectContaining({
          playerId: expect.any(String),
        })
      );
    });

    it('emits error for non-existent game', () => {
      const socket = createMockSocket('socket-1');

      gameManager.joinGame(socket, 'XXXX', 'Player');

      expect(socket.emit).toHaveBeenCalledWith('game:error', 'Game not found');
    });
  });

  describe('reconnect', () => {
    it('reconnects a disconnected player', async () => {
      const socket1 = createMockSocket('socket-1');
      const socket2 = createMockSocket('socket-2');

      // Create game
      gameManager.createGame(socket1, 'TestPlayer');
      const createCall = socket1.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const { gameId, playerId } = createCall[1];

      // Simulate disconnect
      gameManager.handleDisconnect(socket1);

      // Reconnect with new socket
      await gameManager.reconnect(socket2, gameId, playerId);

      expect(socket2.emit).toHaveBeenCalledWith(
        'game:reconnected',
        expect.objectContaining({
          gameId,
          playerId,
        })
      );
      expect(socket2.join).toHaveBeenCalledWith(gameId);
    });

    it('emits error for non-existent game', async () => {
      const socket = createMockSocket('socket-1');

      await gameManager.reconnect(socket, 'XXXX', 'player-id');

      expect(socket.emit).toHaveBeenCalledWith('game:error', 'Game not found');
    });

    it('emits error for non-existent player', async () => {
      const hostSocket = createMockSocket('host-socket');
      const reconnectSocket = createMockSocket('reconnect-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      await gameManager.reconnect(reconnectSocket, gameId, 'wrong-player-id');

      expect(reconnectSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Player not found in game'
      );
    });

    it('marks player as connected after reconnect', async () => {
      const socket1 = createMockSocket('socket-1');
      const socket2 = createMockSocket('socket-2');

      gameManager.createGame(socket1, 'TestPlayer');
      const createCall = socket1.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const { gameId, playerId } = createCall[1];

      // Disconnect
      gameManager.handleDisconnect(socket1);

      // Reconnect
      await gameManager.reconnect(socket2, gameId, playerId);

      // Verify broadcast was called (player should be marked connected)
      expect(io.to).toHaveBeenCalledWith(gameId);
    });
  });

  describe('handleDisconnect', () => {
    it('marks player as disconnected', () => {
      const socket = createMockSocket('socket-1');

      gameManager.createGame(socket, 'TestPlayer');
      const createCall = socket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.handleDisconnect(socket);

      // Should broadcast updated state
      expect(io.to).toHaveBeenCalledWith(gameId);
    });
  });

  describe('leaveGame', () => {
    it('removes player from game', () => {
      const socket = createMockSocket('socket-1');

      gameManager.createGame(socket, 'TestPlayer');

      gameManager.leaveGame(socket);

      expect(socket.leave).toHaveBeenCalled();
    });

    it('allows rejoining after leaving', async () => {
      const socket1 = createMockSocket('socket-1');
      const socket2 = createMockSocket('socket-2');

      // Create game
      gameManager.createGame(socket1, 'Host');
      const createCall = socket1.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      // Leave
      gameManager.leaveGame(socket1);

      // Try to reconnect - should fail (player was removed)
      await gameManager.reconnect(socket2, gameId, createCall[1].playerId);

      // Game should be deleted (was empty)
      expect(socket2.emit).toHaveBeenCalledWith('game:error', 'Game not found');
    });
  });

  describe('startGame', () => {
    it('deals cards based on damage (fewer cards at higher damage)', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      // Manually set damage on host's robot via state
      const state = io.getLastState();
      state.players[0].robot.damage = 5; // Should get 4 cards

      gameManager.startGame(hostSocket);

      const newState = io.getLastState();
      expect(newState.players[0].hand.length).toBe(4); // 9 - 5 = 4
      expect(newState.players[1].hand.length).toBe(9); // No damage
    });

    it('preserves locked registers when dealing new cards', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      // Set up player with damage and a card in the last register
      const state = io.getLastState();
      state.players[0].robot.damage = 5; // 1 locked register (register 5)
      const lockedCard: Card = {
        id: 'locked-card',
        type: 'move1',
        priority: 100,
      };
      state.players[0].registers = [null, null, null, null, lockedCard];

      gameManager.startGame(hostSocket);

      const newState = io.getLastState();
      // Last register should still have the locked card
      expect(newState.players[0].registers[4]).toEqual(lockedCard);
      // Other registers should be cleared
      expect(newState.players[0].registers[0]).toBeNull();
      expect(newState.players[0].registers[1]).toBeNull();
      expect(newState.players[0].registers[2]).toBeNull();
      expect(newState.players[0].registers[3]).toBeNull();
    });

    it('skips destroyed robots when dealing cards', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      // Mark host's robot as destroyed
      const state = io.getLastState();
      state.players[0].robot.isDestroyed = true;

      gameManager.startGame(hostSocket);

      const newState = io.getLastState();
      // Destroyed robot gets no cards and is marked as ready
      expect(newState.players[0].hand.length).toBe(0);
      expect(newState.players[0].isReady).toBe(true);
      // Other player gets normal cards
      expect(newState.players[1].hand.length).toBe(9);
      expect(newState.players[1].isReady).toBe(false);
    });
  });

  describe('addAIPlayer', () => {
    it('adds an AI player to the game', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');

      gameManager.addAIPlayer(hostSocket, 'medium');

      const state = io.getLastState();
      expect(state.players.length).toBe(2);
      expect(state.players[1].isAI).toBe(true);
      expect(state.players[1].aiDifficulty).toBe('medium');
    });

    it('assigns unique AI names', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');
      gameManager.addAIPlayer(hostSocket, 'medium');

      const state = io.getLastState();
      expect(state.players[1].name).not.toBe(state.players[2].name);
    });

    it('only allows host to add AI', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;
      gameManager.joinGame(guestSocket, gameId, 'Guest');

      gameManager.addAIPlayer(guestSocket, 'hard');

      expect(guestSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Only the host can add AI players'
      );
    });

    it('respects max player limit', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');

      // Add 7 AI players (host + 7 AI = 8 max)
      for (let i = 0; i < 7; i++) {
        gameManager.addAIPlayer(hostSocket, 'easy');
      }

      // Try to add one more
      gameManager.addAIPlayer(hostSocket, 'easy');

      expect(hostSocket.emit).toHaveBeenCalledWith('game:error', 'Game is full');
    });

    it('prevents adding AI after game starts', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');

      // Start the game
      gameManager.startGame(hostSocket);

      // Try to add AI after start
      gameManager.addAIPlayer(hostSocket, 'medium');

      expect(hostSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Cannot add AI after game starts'
      );
    });
  });

  describe('removeAIPlayer', () => {
    it('removes an AI player from the game', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'medium');

      const stateWithAI = io.getLastState();
      const aiPlayerId = stateWithAI.players[1].id;

      gameManager.removeAIPlayer(hostSocket, aiPlayerId);

      const stateAfter = io.getLastState();
      expect(stateAfter.players.length).toBe(1);
      expect(stateAfter.players[0].isAI).toBe(false);
    });

    it('only allows host to remove AI', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.addAIPlayer(hostSocket, 'medium');
      const stateWithAI = io.getLastState();
      const aiPlayerId = stateWithAI.players[1].id;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      gameManager.removeAIPlayer(guestSocket, aiPlayerId);

      expect(guestSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Only the host can remove AI players'
      );
    });

    it('returns error for non-existent AI player', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');

      gameManager.removeAIPlayer(hostSocket, 'non-existent-id');

      expect(hostSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'AI player not found'
      );
    });

    it('cannot remove human players', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      const state = io.getLastState();
      const guestPlayerId = state.players[1].id;

      gameManager.removeAIPlayer(hostSocket, guestPlayerId);

      expect(hostSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'AI player not found'
      );
    });
  });

  describe('AI during game', () => {
    it('AI players auto-program their registers when game starts', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'medium');

      gameManager.startGame(hostSocket);

      const state = io.getLastState();
      const aiPlayer = state.players.find((p: any) => p.isAI);

      // AI should have all registers filled
      expect(aiPlayer.registers.every((r: any) => r !== null)).toBe(true);
      // AI should be marked as ready
      expect(aiPlayer.isReady).toBe(true);
    });

    it('allows starting game with only 1 human and 1 AI', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'hard');

      gameManager.startGame(hostSocket);

      const state = io.getLastState();
      expect(state.phase).toBe('programming');
    });
  });
});
