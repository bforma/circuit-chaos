import { Server, Socket } from 'socket.io';
import {
  GameState,
  Player,
  Card,
  createPlayer,
  createRobot,
  createEmptyBoard,
  REGISTERS_COUNT,
  DEFAULT_BOARD_WIDTH,
  DEFAULT_BOARD_HEIGHT,
} from '@circuit-chaos/shared';
import { createDeck, dealCards } from './deck';
import { executeRegister } from './executor';
import { createSampleBoard } from './boards';

interface GameSession {
  state: GameState;
  playerSockets: Map<string, string>; // playerId -> socketId
  socketPlayers: Map<string, string>; // socketId -> playerId
}

export class GameManager {
  private io: Server;
  private games: Map<string, GameSession> = new Map();
  private socketToGame: Map<string, string> = new Map(); // socketId -> gameId

  constructor(io: Server) {
    this.io = io;
  }

  private generateGameId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let id = '';
    for (let i = 0; i < 4; i++) {
      id += chars[Math.floor(Math.random() * chars.length)];
    }
    return id;
  }

  private broadcastGameState(gameId: string) {
    const session = this.games.get(gameId);
    if (!session) return;

    this.io.to(gameId).emit('game:state', session.state);
  }

  createGame(socket: Socket, playerName: string) {
    // Generate unique game ID
    let gameId: string;
    do {
      gameId = this.generateGameId();
    } while (this.games.has(gameId));

    const playerId = crypto.randomUUID();
    const board = createSampleBoard();

    // Create player without robot initially
    const playerData = createPlayer(playerId, playerName, 0);
    const robot = createRobot(playerId, board.spawnPoints[0] || { x: 0, y: 0 });
    const player: Player = { ...playerData, robot };

    const state: GameState = {
      id: gameId,
      phase: 'lobby',
      board,
      players: [player],
      currentRegister: 0,
      turn: 0,
      hostId: playerId,
      maxPlayers: 8,
      createdAt: Date.now(),
    };

    const session: GameSession = {
      state,
      playerSockets: new Map([[playerId, socket.id]]),
      socketPlayers: new Map([[socket.id, playerId]]),
    };

    this.games.set(gameId, session);
    this.socketToGame.set(socket.id, gameId);

    socket.join(gameId);
    socket.emit('game:created', { gameId, playerId });
    this.broadcastGameState(gameId);

    console.log(`Game ${gameId} created by ${playerName}`);
  }

  joinGame(socket: Socket, gameId: string, playerName: string) {
    const session = this.games.get(gameId);
    if (!session) {
      socket.emit('game:error', 'Game not found');
      return;
    }

    if (session.state.phase !== 'lobby') {
      socket.emit('game:error', 'Game already in progress');
      return;
    }

    if (session.state.players.length >= session.state.maxPlayers) {
      socket.emit('game:error', 'Game is full');
      return;
    }

    const playerId = crypto.randomUUID();
    const colorIndex = session.state.players.length;
    const spawnPoint = session.state.board.spawnPoints[colorIndex] || { x: colorIndex, y: 0 };

    const playerData = createPlayer(playerId, playerName, colorIndex);
    const robot = createRobot(playerId, spawnPoint);
    const player: Player = { ...playerData, robot };

    session.state.players.push(player);
    session.playerSockets.set(playerId, socket.id);
    session.socketPlayers.set(socket.id, playerId);
    this.socketToGame.set(socket.id, gameId);

    socket.join(gameId);
    socket.emit('game:joined', { playerId });
    this.broadcastGameState(gameId);

    console.log(`${playerName} joined game ${gameId}`);
  }

  leaveGame(socket: Socket) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session) return;

    const playerId = session.socketPlayers.get(socket.id);
    if (!playerId) return;

    // Remove player
    session.state.players = session.state.players.filter(p => p.id !== playerId);
    session.playerSockets.delete(playerId);
    session.socketPlayers.delete(socket.id);
    this.socketToGame.delete(socket.id);

    socket.leave(gameId);

    // Delete game if empty
    if (session.state.players.length === 0) {
      this.games.delete(gameId);
      console.log(`Game ${gameId} deleted (empty)`);
      return;
    }

    // Transfer host if needed
    if (session.state.hostId === playerId) {
      session.state.hostId = session.state.players[0].id;
    }

    this.broadcastGameState(gameId);
  }

  startGame(socket: Socket) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session) return;

    const playerId = session.socketPlayers.get(socket.id);
    if (playerId !== session.state.hostId) {
      socket.emit('game:error', 'Only the host can start the game');
      return;
    }

    if (session.state.players.length < 2) {
      socket.emit('game:error', 'Need at least 2 players');
      return;
    }

    // Deal cards to all players
    this.dealCardsToPlayers(session);
    session.state.phase = 'programming';
    session.state.turn = 1;

    this.broadcastGameState(gameId);
    console.log(`Game ${gameId} started`);
  }

  private dealCardsToPlayers(session: GameSession) {
    const deck = createDeck();

    for (const player of session.state.players) {
      const handSize = 9 - player.robot.damage;
      const cards = dealCards(deck, handSize);
      player.hand = cards;
      player.registers = [null, null, null, null, null];
      player.isReady = false;
    }
  }

  programRegister(socket: Socket, registerIndex: number, card: Card | null) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session || session.state.phase !== 'programming') return;

    const playerId = session.socketPlayers.get(socket.id);
    const player = session.state.players.find(p => p.id === playerId);
    if (!player || player.isReady) return;

    if (registerIndex < 0 || registerIndex >= REGISTERS_COUNT) return;

    player.registers[registerIndex] = card;
    this.broadcastGameState(gameId);
  }

  submitProgram(socket: Socket) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session || session.state.phase !== 'programming') return;

    const playerId = session.socketPlayers.get(socket.id);
    const player = session.state.players.find(p => p.id === playerId);
    if (!player) return;

    // Check all registers are filled
    if (player.registers.some(r => r === null)) {
      socket.emit('game:error', 'All registers must be filled');
      return;
    }

    player.isReady = true;
    this.broadcastGameState(gameId);

    // Check if all players are ready
    if (session.state.players.every(p => p.isReady)) {
      this.executeRound(session, gameId);
    }
  }

  private async executeRound(session: GameSession, gameId: string) {
    session.state.phase = 'executing';
    this.broadcastGameState(gameId);

    // Execute each register
    for (let register = 0; register < REGISTERS_COUNT; register++) {
      session.state.currentRegister = register;
      this.broadcastGameState(gameId);

      // Execute movements
      executeRegister(session.state, register);

      // Small delay for animation
      await new Promise(resolve => setTimeout(resolve, 1000));
      this.broadcastGameState(gameId);

      // Check for winner
      const winner = this.checkWinner(session.state);
      if (winner) {
        session.state.phase = 'finished';
        session.state.winnerId = winner.id;
        this.broadcastGameState(gameId);
        return;
      }
    }

    // Cleanup phase
    session.state.phase = 'cleanup';
    this.broadcastGameState(gameId);

    // Deal new cards and start next round
    this.dealCardsToPlayers(session);
    session.state.phase = 'programming';
    session.state.turn++;
    session.state.currentRegister = 0;

    this.broadcastGameState(gameId);
  }

  private checkWinner(state: GameState): Player | null {
    const totalCheckpoints = state.board.checkpoints.length;
    return state.players.find(p => p.robot.lastCheckpoint >= totalCheckpoints) || null;
  }

  handleDisconnect(socket: Socket) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session) return;

    const playerId = session.socketPlayers.get(socket.id);
    if (!playerId) return;

    const player = session.state.players.find(p => p.id === playerId);
    if (player) {
      player.isConnected = false;
    }

    this.broadcastGameState(gameId);

    // Clean up after timeout if still disconnected
    setTimeout(() => {
      const currentSession = this.games.get(gameId);
      if (!currentSession) return;

      const currentPlayer = currentSession.state.players.find(p => p.id === playerId);
      if (currentPlayer && !currentPlayer.isConnected) {
        this.leaveGame(socket);
      }
    }, 30000);
  }
}
