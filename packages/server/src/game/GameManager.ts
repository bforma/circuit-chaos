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
  DisconnectVoteOption,
  DISCONNECT_VOTE_DELAY_MS,
  DISCONNECT_VOTE_DURATION_MS,
  ThemeId,
  DEFAULT_THEME,
  THEMES,
  getLockedRegisterCount,
  getHandSize,
} from '@circuit-chaos/shared';
import { createDeck, dealCards } from './deck';
import { executeRegister, respawnDestroyedRobots } from './executor';
import { createSampleBoard } from './boards';
import { getRedis } from '../redis';

const GAME_PREFIX = 'game:';
const GAME_TTL = 60 * 60 * 24; // 24 hours

interface GameSession {
  state: GameState;
  playerSockets: Map<string, string>; // playerId -> socketId
  socketPlayers: Map<string, string>; // socketId -> playerId
  disconnectTimers: Map<string, NodeJS.Timeout>; // playerId -> timer for vote start
  voteTimer?: NodeJS.Timeout; // Timer for vote end
}

export class GameManager {
  private io: Server;
  private games: Map<string, GameSession> = new Map();
  private socketToGame: Map<string, string> = new Map(); // socketId -> gameId

  constructor(io: Server) {
    this.io = io;
  }

  // Persist game state to Redis (fire and forget)
  private persistGame(gameId: string, state: GameState) {
    const redis = getRedis();
    if (redis) {
      redis.setex(GAME_PREFIX + gameId, GAME_TTL, JSON.stringify(state)).catch(err => {
        console.error('Failed to persist game:', err.message);
      });
    }
  }

  // Delete game from Redis
  private unpersistGame(gameId: string) {
    const redis = getRedis();
    if (redis) {
      redis.del(GAME_PREFIX + gameId).catch(err => {
        console.error('Failed to delete game from Redis:', err.message);
      });
    }
  }

  // Load game from Redis (for reconnection after server restart)
  async loadGameFromRedis(gameId: string): Promise<GameState | null> {
    const redis = getRedis();
    if (!redis) return null;

    try {
      const data = await redis.get(GAME_PREFIX + gameId);
      if (data) {
        return JSON.parse(data);
      }
    } catch (err) {
      console.error('Failed to load game from Redis:', err);
    }
    return null;
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
    this.persistGame(gameId, session.state);
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
      theme: DEFAULT_THEME,
    };

    const session: GameSession = {
      state,
      playerSockets: new Map([[playerId, socket.id]]),
      socketPlayers: new Map([[socket.id, playerId]]),
      disconnectTimers: new Map(),
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
      this.unpersistGame(gameId);
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
      if (player.robot.isDestroyed) {
        player.hand = [];
        player.registers = [null, null, null, null, null];
        player.isReady = true; // Skip destroyed robots
        continue;
      }

      const handSize = getHandSize(player.robot.damage);
      const lockedCount = getLockedRegisterCount(player.robot.damage);
      const cards = dealCards(deck, handSize);
      player.hand = cards;

      // Preserve locked registers (last N registers stay locked)
      const newRegisters: (Card | null)[] = [];
      for (let i = 0; i < REGISTERS_COUNT; i++) {
        const isLocked = i >= REGISTERS_COUNT - lockedCount;
        newRegisters[i] = isLocked ? player.registers[i] : null;
      }
      player.registers = newRegisters;
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

    // Respawn destroyed robots before dealing new cards
    respawnDestroyedRobots(session.state);

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

    // Update mappings
    session.socketPlayers.delete(socket.id);
    this.socketToGame.delete(socket.id);

    const player = session.state.players.find(p => p.id === playerId);
    if (!player) return;

    player.isConnected = false;
    player.disconnectedAt = Date.now();
    this.broadcastGameState(gameId);

    // In lobby: remove after 60 seconds
    // In game: start vote after 30 seconds
    if (session.state.phase === 'lobby') {
      this.schedulePlayerRemoval(gameId, playerId, 60000);
    } else {
      this.scheduleDisconnectVote(gameId, playerId);
    }
  }

  private schedulePlayerRemoval(gameId: string, playerId: string, delay: number) {
    const session = this.games.get(gameId);
    if (!session) return;

    // Clear existing timer if any
    const existingTimer = session.disconnectTimers.get(playerId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.removePlayerFromGame(gameId, playerId);
    }, delay);

    session.disconnectTimers.set(playerId, timer);
  }

  private scheduleDisconnectVote(gameId: string, playerId: string) {
    const session = this.games.get(gameId);
    if (!session) return;

    // Clear existing timer if any
    const existingTimer = session.disconnectTimers.get(playerId);
    if (existingTimer) clearTimeout(existingTimer);

    const timer = setTimeout(() => {
      this.startDisconnectVote(gameId, playerId);
    }, DISCONNECT_VOTE_DELAY_MS);

    session.disconnectTimers.set(playerId, timer);
    console.log(`Scheduled disconnect vote for ${playerId} in ${DISCONNECT_VOTE_DELAY_MS}ms`);
  }

  private startDisconnectVote(gameId: string, playerId: string) {
    const session = this.games.get(gameId);
    if (!session) return;

    const player = session.state.players.find(p => p.id === playerId);
    if (!player || player.isConnected) return; // Player reconnected

    // Don't start vote if there's only 1 connected player left
    const connectedPlayers = session.state.players.filter(p => p.isConnected);
    if (connectedPlayers.length < 1) return;

    const now = Date.now();
    session.state.disconnectVote = {
      playerId,
      playerName: player.name,
      votes: {},
      startedAt: now,
      endsAt: now + DISCONNECT_VOTE_DURATION_MS,
    };

    this.broadcastGameState(gameId);
    console.log(`Started disconnect vote for ${player.name} in game ${gameId}`);

    // Schedule vote end
    session.voteTimer = setTimeout(() => {
      this.endDisconnectVote(gameId);
    }, DISCONNECT_VOTE_DURATION_MS);
  }

  submitDisconnectVote(socket: Socket, vote: DisconnectVoteOption) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session || !session.state.disconnectVote) return;

    const voterId = session.socketPlayers.get(socket.id);
    if (!voterId) return;

    // Can't vote on yourself
    if (voterId === session.state.disconnectVote.playerId) return;

    session.state.disconnectVote.votes[voterId] = vote;
    this.broadcastGameState(gameId);

    // Check if all connected players have voted
    const connectedPlayers = session.state.players.filter(
      p => p.isConnected && p.id !== session.state.disconnectVote!.playerId
    );
    const voteCount = Object.keys(session.state.disconnectVote.votes).length;

    if (voteCount >= connectedPlayers.length) {
      // All votes in, end vote early
      if (session.voteTimer) clearTimeout(session.voteTimer);
      this.endDisconnectVote(gameId);
    }
  }

  private endDisconnectVote(gameId: string) {
    const session = this.games.get(gameId);
    if (!session || !session.state.disconnectVote) return;

    const vote = session.state.disconnectVote;
    const playerId = vote.playerId;

    // Tally votes
    const voteCounts: Record<DisconnectVoteOption, number> = {
      'remove': 0,
      'random-cards': 0,
      'stop-game': 0,
    };

    for (const v of Object.values(vote.votes)) {
      voteCounts[v]++;
    }

    // Find winner (most votes, tie goes to random-cards)
    let winner: DisconnectVoteOption = 'random-cards';
    let maxVotes = 0;

    for (const [option, count] of Object.entries(voteCounts)) {
      if (count > maxVotes) {
        maxVotes = count;
        winner = option as DisconnectVoteOption;
      }
    }

    // Clear vote state
    session.state.disconnectVote = undefined;
    session.voteTimer = undefined;

    console.log(`Vote ended for ${vote.playerName}: ${winner} (${maxVotes} votes)`);

    // Execute the decision
    this.executeDisconnectDecision(gameId, playerId, winner);
  }

  private executeDisconnectDecision(
    gameId: string,
    playerId: string,
    decision: DisconnectVoteOption
  ) {
    const session = this.games.get(gameId);
    if (!session) return;

    const player = session.state.players.find(p => p.id === playerId);

    switch (decision) {
      case 'remove':
        this.removePlayerFromGame(gameId, playerId);
        break;

      case 'random-cards':
        if (player) {
          this.assignRandomCards(session, player);
        }
        this.broadcastGameState(gameId);
        this.checkAllPlayersReady(session, gameId);
        break;

      case 'stop-game':
        session.state.phase = 'finished';
        this.broadcastGameState(gameId);
        break;
    }
  }

  private assignRandomCards(session: GameSession, player: Player) {
    // Only assign if in programming phase and player hasn't submitted
    if (session.state.phase !== 'programming' || player.isReady) return;

    const availableCards = player.hand.filter(
      card => !player.registers.some(r => r?.id === card.id)
    );

    // Fill empty registers with random cards
    for (let i = 0; i < player.registers.length; i++) {
      if (!player.registers[i] && availableCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * availableCards.length);
        player.registers[i] = availableCards.splice(randomIndex, 1)[0];
      }
    }

    player.isReady = true;
    console.log(`Assigned random cards to disconnected player ${player.name}`);
  }

  private removePlayerFromGame(gameId: string, playerId: string) {
    const session = this.games.get(gameId);
    if (!session) return;

    // Clear any pending timers
    const timer = session.disconnectTimers.get(playerId);
    if (timer) clearTimeout(timer);
    session.disconnectTimers.delete(playerId);

    // Remove player
    session.state.players = session.state.players.filter(p => p.id !== playerId);
    session.playerSockets.delete(playerId);

    // Delete game if empty
    if (session.state.players.length === 0) {
      this.games.delete(gameId);
      this.unpersistGame(gameId);
      console.log(`Game ${gameId} deleted (empty)`);
      return;
    }

    // Transfer host if needed
    if (session.state.hostId === playerId) {
      session.state.hostId = session.state.players[0].id;
    }

    this.broadcastGameState(gameId);
    console.log(`Removed disconnected player ${playerId} from game ${gameId}`);

    // Check if game can continue
    if (session.state.phase !== 'lobby' && session.state.players.length < 2) {
      // Not enough players to continue
      session.state.phase = 'finished';
      this.broadcastGameState(gameId);
    } else {
      this.checkAllPlayersReady(session, gameId);
    }
  }

  private checkAllPlayersReady(session: GameSession, gameId: string) {
    if (session.state.phase !== 'programming') return;
    if (session.state.players.every(p => p.isReady)) {
      this.executeRound(session, gameId);
    }
  }

  setTheme(socket: Socket, theme: ThemeId) {
    const gameId = this.socketToGame.get(socket.id);
    if (!gameId) return;

    const session = this.games.get(gameId);
    if (!session) return;

    // Only host can change theme
    const playerId = session.socketPlayers.get(socket.id);
    if (playerId !== session.state.hostId) {
      socket.emit('game:error', 'Only the host can change the theme');
      return;
    }

    // Only in lobby phase
    if (session.state.phase !== 'lobby') {
      socket.emit('game:error', 'Cannot change theme after game starts');
      return;
    }

    // Validate theme
    if (!THEMES.some(t => t.id === theme)) {
      socket.emit('game:error', 'Invalid theme');
      return;
    }

    session.state.theme = theme;
    this.broadcastGameState(gameId);
    console.log(`Game ${gameId} theme changed to ${theme}`);
  }

  async reconnect(socket: Socket, gameId: string, playerId: string) {
    let session = this.games.get(gameId);

    // Try to restore from Redis if not in memory
    if (!session) {
      const state = await this.loadGameFromRedis(gameId);
      if (state) {
        session = {
          state,
          playerSockets: new Map(),
          socketPlayers: new Map(),
          disconnectTimers: new Map(),
        };
        // Mark all players as disconnected initially
        for (const player of session.state.players) {
          player.isConnected = false;
        }
        this.games.set(gameId, session);
        console.log(`Restored game ${gameId} from Redis`);
      }
    }

    if (!session) {
      socket.emit('game:error', 'Game not found');
      return;
    }

    const player = session.state.players.find(p => p.id === playerId);
    if (!player) {
      socket.emit('game:error', 'Player not found in game');
      return;
    }

    // Cancel any pending disconnect timers
    const timer = session.disconnectTimers.get(playerId);
    if (timer) {
      clearTimeout(timer);
      session.disconnectTimers.delete(playerId);
    }

    // Cancel vote if it was about this player
    if (session.state.disconnectVote?.playerId === playerId) {
      session.state.disconnectVote = undefined;
      if (session.voteTimer) {
        clearTimeout(session.voteTimer);
        session.voteTimer = undefined;
      }
    }

    // Update socket mappings
    session.playerSockets.set(playerId, socket.id);
    session.socketPlayers.set(socket.id, playerId);
    this.socketToGame.set(socket.id, gameId);

    // Mark player as connected
    player.isConnected = true;
    player.disconnectedAt = undefined;

    socket.join(gameId);
    socket.emit('game:reconnected', { gameId, playerId });
    this.broadcastGameState(gameId);

    console.log(`Player ${player.name} reconnected to game ${gameId}`);
  }
}
