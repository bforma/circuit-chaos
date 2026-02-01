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

      gameManager.startGame(hostSocket);

      const newState = io.getLastState();
      // 2023 rules: always draw up to 9 cards
      expect(newState.players[0].hand.length).toBe(9);
      expect(newState.players[1].hand.length).toBe(9);
    });

    it('keeps SPAM cards in hand between rounds (2023 rules)', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');

      // Add SPAM cards to player's hand before starting
      const state = io.getLastState();
      const spamCard: Card = {
        id: 'spam-card',
        type: 'spam',
        priority: 0,
      };
      state.players[0].hand = [spamCard];

      gameManager.startGame(hostSocket);

      const newState = io.getLastState();
      // Should have 9 cards total, including the SPAM card
      expect(newState.players[0].hand.length).toBe(9);
      // SPAM card should still be in hand
      expect(newState.players[0].hand.some((c: Card) => c.id === 'spam-card')).toBe(true);
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

  describe('card management', () => {
    it('players have 20 cards total in deck + discard + hand + registers', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');
      gameManager.startGame(hostSocket);

      const state = io.getLastState();
      const player = state.players[0];

      // Count all cards
      const deckCount = player.deck.length;
      const discardCount = player.discardPile.length;
      const handCount = player.hand.length;
      const registerCount = player.registers.filter((r: any) => r !== null).length;

      const totalCards = deckCount + discardCount + handCount + registerCount;
      expect(totalCards).toBe(20); // Personal deck has 20 cards
    });
  });

  describe('programRegister', () => {
    it('validates card exists in player hand', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');
      gameManager.startGame(hostSocket);

      const stateBefore = io.getLastState();
      const fakeCard: Card = { id: 'fake-card-not-in-hand', type: 'move3', priority: 0 };

      // Try to program a card not in hand
      gameManager.programRegister(hostSocket, 0, fakeCard);

      const stateAfter = io.getLastState();
      // Register should still be null (card was rejected)
      expect(stateAfter.players[0].registers[0]).toBeNull();
    });

    it('accepts card that exists in player hand', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');
      gameManager.startGame(hostSocket);

      const state = io.getLastState();
      const cardFromHand = state.players[0].hand[0];

      gameManager.programRegister(hostSocket, 0, cardFromHand);

      const stateAfter = io.getLastState();
      expect(stateAfter.players[0].registers[0]).not.toBeNull();
      expect(stateAfter.players[0].registers[0].id).toBe(cardFromHand.id);
    });

    it('allows clearing a register with null', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');
      gameManager.startGame(hostSocket);

      const state = io.getLastState();
      const cardFromHand = state.players[0].hand[0];

      // Place card
      gameManager.programRegister(hostSocket, 0, cardFromHand);

      // Clear register
      gameManager.programRegister(hostSocket, 0, null);

      const stateAfter = io.getLastState();
      expect(stateAfter.players[0].registers[0]).toBeNull();
    });
  });

  describe('card discard at end of round', () => {
    it('does not duplicate cards when discarding from hand and registers', () => {
      const hostSocket = createMockSocket('host-socket');

      gameManager.createGame(hostSocket, 'Host');
      gameManager.addAIPlayer(hostSocket, 'easy');
      gameManager.startGame(hostSocket);

      // Get initial state and count unique card IDs
      const initialState = io.getLastState();
      const player = initialState.players[0];

      // Collect all unique card IDs at start
      const allCardIds = new Set<string>();
      player.hand.forEach((c: Card) => allCardIds.add(c.id));
      player.deck.forEach((c: Card) => allCardIds.add(c.id));
      player.discardPile.forEach((c: Card) => allCardIds.add(c.id));
      player.registers.filter((r: Card | null) => r !== null).forEach((c: Card) => allCardIds.add(c!.id));

      const initialUniqueCardCount = allCardIds.size;

      // Program all registers with cards from hand
      for (let i = 0; i < REGISTERS_COUNT; i++) {
        const card = player.hand[i];
        if (card) {
          gameManager.programRegister(hostSocket, i, card);
        }
      }

      // Submit program
      gameManager.submitProgram(hostSocket);

      // AI is already ready, so game should execute and start new round
      // Wait for state update
      const finalState = io.getLastState();
      const finalPlayer = finalState.players[0];

      // Count unique card IDs after round
      const finalCardIds = new Set<string>();
      finalPlayer.hand.forEach((c: Card) => finalCardIds.add(c.id));
      finalPlayer.deck.forEach((c: Card) => finalCardIds.add(c.id));
      finalPlayer.discardPile.forEach((c: Card) => finalCardIds.add(c.id));
      finalPlayer.registers.filter((r: Card | null) => r !== null).forEach((c: Card) => finalCardIds.add(c!.id));

      // Should still have same number of unique cards (no duplicates created)
      expect(finalCardIds.size).toBe(initialUniqueCardCount);
    });
  });

  describe('playAgain', () => {
    it('resets game to lobby when host calls playAgain', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      // Create and start a game
      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');
      gameManager.startGame(hostSocket);

      // Set game to finished state
      const state = io.getLastState();
      state.phase = 'finished';
      state.winnerId = state.players[0].id;

      // Call playAgain
      gameManager.playAgain(hostSocket);

      const finalState = io.getLastState();
      expect(finalState.phase).toBe('lobby');
      expect(finalState.winnerId).toBeUndefined();
      expect(finalState.turn).toBe(0);
    });

    it('only allows host to restart the game', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');
      gameManager.startGame(hostSocket);

      // Set game to finished
      const state = io.getLastState();
      state.phase = 'finished';
      state.winnerId = state.players[0].id;

      // Guest tries to restart
      gameManager.playAgain(guestSocket);

      expect(guestSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Only the host can restart the game'
      );
    });

    it('only works when game is finished', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');
      gameManager.startGame(hostSocket);

      // Game is in programming phase, not finished
      gameManager.playAgain(hostSocket);

      expect(hostSocket.emit).toHaveBeenCalledWith(
        'game:error',
        'Game is not finished'
      );
    });

    it('resets all player robots and cards', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');
      gameManager.startGame(hostSocket);

      // Set game to finished with some player state
      const state = io.getLastState();
      state.phase = 'finished';
      state.winnerId = state.players[0].id;
      state.players[0].robot.isDestroyed = true;
      state.players[0].robot.lastCheckpoint = 3;

      gameManager.playAgain(hostSocket);

      const finalState = io.getLastState();

      // Check robots are reset
      for (const player of finalState.players) {
        expect(player.robot.isDestroyed).toBe(false);
        expect(player.robot.lastCheckpoint).toBe(0);
        expect(player.hand).toHaveLength(0);
        expect(player.registers).toEqual([null, null, null, null, null]);
        expect(player.isReady).toBe(false);
      }
    });

    it('keeps the same players after restart', () => {
      const hostSocket = createMockSocket('host-socket');
      const guestSocket = createMockSocket('guest-socket');

      gameManager.createGame(hostSocket, 'Host');
      const createCall = hostSocket.emit.mock.calls.find(
        (c: any[]) => c[0] === 'game:created'
      );
      const gameId = createCall[1].gameId;

      gameManager.joinGame(guestSocket, gameId, 'Guest');
      gameManager.startGame(hostSocket);

      const stateBefore = io.getLastState();
      const playerIdsBefore = stateBefore.players.map((p: any) => p.id);

      // Set game to finished
      stateBefore.phase = 'finished';
      stateBefore.winnerId = stateBefore.players[0].id;

      gameManager.playAgain(hostSocket);

      const stateAfter = io.getLastState();
      const playerIdsAfter = stateAfter.players.map((p: any) => p.id);

      expect(playerIdsAfter).toEqual(playerIdsBefore);
      expect(stateAfter.players).toHaveLength(2);
    });
  });
});
