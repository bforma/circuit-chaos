import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { GameManager } from './GameManager';

// Mock socket
function createMockSocket(id: string) {
  return {
    id,
    join: vi.fn(),
    leave: vi.fn(),
    emit: vi.fn(),
  } as any;
}

// Mock io server
function createMockIO() {
  return {
    to: vi.fn(() => ({
      emit: vi.fn(),
    })),
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
    it('reconnects a disconnected player', () => {
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
      gameManager.reconnect(socket2, gameId, playerId);

      expect(socket2.emit).toHaveBeenCalledWith(
        'game:reconnected',
        expect.objectContaining({
          gameId,
          playerId,
        })
      );
      expect(socket2.join).toHaveBeenCalledWith(gameId);
    });

    it('emits error for non-existent game', () => {
      const socket = createMockSocket('socket-1');

      gameManager.reconnect(socket, 'XXXX', 'player-id');

      expect(socket.emit).toHaveBeenCalledWith('game:error', 'Game not found');
    });

    it('emits error for non-existent player', () => {
      const hostSocket = createMockSocket('host-socket');
      const reconnectSocket = createMockSocket('reconnect-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.reconnect(reconnectSocket, gameId, 'wrong-player-id');

      expect(reconnectSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Player not found in game'
      );
    });

    it('marks player as connected after reconnect', () => {
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
      gameManager.reconnect(socket2, gameId, playerId);

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

    it('allows rejoining after leaving', () => {
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
      gameManager.reconnect(socket2, gameId, createCall[1].playerId);

      // Game should be deleted (was empty)
      expect(socket2.emit).toHaveBeenCalledWith('game:error', 'Game not found');
    });
  });
});
