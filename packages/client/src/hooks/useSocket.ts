import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type { GameState, Card, DisconnectVoteOption, ThemeId, AIDifficulty } from '@circuit-chaos/shared';

// URL and session helpers
function getGameIdFromUrl(): string | null {
  const hash = window.location.hash;
  // Format: #ABCD or #/ABCD
  const match = hash.match(/^#\/?([A-Z0-9]{4})$/i);
  return match ? match[1].toUpperCase() : null;
}

function setGameIdInUrl(gameId: string) {
  window.history.replaceState(null, '', `#${gameId}`);
}

function clearGameIdFromUrl() {
  window.history.replaceState(null, '', window.location.pathname);
}

// Use sessionStorage (per-tab) instead of localStorage (shared between tabs)
function getPlayerIdForGame(gameId: string): string | null {
  return sessionStorage.getItem(`circuit-chaos-player-${gameId}`);
}

function savePlayerIdForGame(gameId: string, playerId: string) {
  sessionStorage.setItem(`circuit-chaos-player-${gameId}`, playerId);
}

function clearPlayerIdForGame(gameId: string) {
  sessionStorage.removeItem(`circuit-chaos-player-${gameId}`);
}

// Get session from URL + localStorage
function getSession() {
  const gameId = getGameIdFromUrl();
  if (!gameId) return null;

  const playerId = getPlayerIdForGame(gameId);
  return playerId ? { gameId, playerId } : { gameId, playerId: null };
}

// Socket events
interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:created': (data: { gameId: string; playerId: string }) => void;
  'game:joined': (data: { playerId: string }) => void;
  'game:reconnected': (data: { gameId: string; playerId: string }) => void;
  'game:error': (message: string) => void;
}

interface ClientToServerEvents {
  'game:create': (playerName: string) => void;
  'game:join': (gameId: string, playerName: string) => void;
  'game:reconnect': (gameId: string, playerId: string) => void;
  'game:leave': () => void;
  'game:start': () => void;
  'game:program': (registerIndex: number, card: Card | null) => void;
  'game:submit': () => void;
  'game:powerDown': () => void;
  'game:vote-disconnect': (vote: DisconnectVoteOption) => void;
  'game:setTheme': (theme: ThemeId) => void;
  'game:addAI': (difficulty: AIDifficulty) => void;
  'game:removeAI': (aiPlayerId: string) => void;
}

let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
let initialized = false;

function initializeSocket() {
  if (initialized || socket) return;
  initialized = true;

  socket = io({
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    useGameStore.getState().setConnected(true);

    // Try to reconnect to existing session from URL
    const session = getSession();
    if (session?.gameId && session?.playerId) {
      console.log('Attempting to reconnect to game:', session.gameId);
      socket?.emit('game:reconnect', session.gameId, session.playerId);
    } else if (session?.gameId) {
      // Game ID in URL but no player ID - show join prompt
      useGameStore.getState().setGameIdToJoin(session.gameId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    useGameStore.getState().setConnected(false);
  });

  socket.on('game:created', ({ gameId, playerId }) => {
    console.log('Game created:', gameId);
    setGameIdInUrl(gameId);
    savePlayerIdForGame(gameId, playerId);
    useGameStore.getState().setPlayerId(playerId);
    useGameStore.getState().setScreen('lobby');
  });

  socket.on('game:joined', ({ playerId }) => {
    console.log('Joined game as:', playerId);
    useGameStore.getState().setPlayerId(playerId);
    useGameStore.getState().setScreen('lobby');
    useGameStore.getState().setGameIdToJoin(null);
  });

  socket.on('game:reconnected', ({ gameId, playerId }) => {
    console.log('Reconnected to game:', gameId);
    setGameIdInUrl(gameId);
    savePlayerIdForGame(gameId, playerId);
    useGameStore.getState().setPlayerId(playerId);
  });

  socket.on('game:state', (state) => {
    console.log('Game state update:', state.phase);
    useGameStore.getState().setGameState(state);

    // Save player ID when we receive state (for join scenario)
    const playerId = useGameStore.getState().playerId;
    if (playerId) {
      setGameIdInUrl(state.id);
      savePlayerIdForGame(state.id, playerId);
    }

    // Update screen based on game phase
    const currentScreen = useGameStore.getState().screen;
    if (state.phase === 'lobby' && currentScreen === 'menu') {
      useGameStore.getState().setScreen('lobby');
    } else if (state.phase !== 'lobby' && currentScreen !== 'game') {
      useGameStore.getState().setScreen('game');
    }
  });

  socket.on('game:error', (message) => {
    console.error('Game error:', message);
    const gameId = getGameIdFromUrl();

    // Clear session if game/player not found
    if (message.includes('not found')) {
      if (gameId) {
        clearPlayerIdForGame(gameId);
      }
      // Don't clear URL - user might want to join as new player
    }

    // Set error in store for UI display
    useGameStore.getState().setError(message);
  });
}

export function useSocket() {
  useEffect(() => {
    initializeSocket();
  }, []);

  const createGame = (playerName: string) => {
    socket?.emit('game:create', playerName);
  };

  const joinGame = (gameId: string, playerName: string) => {
    setGameIdInUrl(gameId);
    socket?.emit('game:join', gameId, playerName);
  };

  const leaveGame = () => {
    const gameId = getGameIdFromUrl();
    socket?.emit('game:leave');
    if (gameId) {
      clearPlayerIdForGame(gameId);
    }
    clearGameIdFromUrl();
    useGameStore.getState().reset();
  };

  const startGame = () => {
    socket?.emit('game:start');
  };

  const programRegister = (registerIndex: number, card: Card | null) => {
    socket?.emit('game:program', registerIndex, card);
  };

  const submitProgram = () => {
    socket?.emit('game:submit');
  };

  const togglePowerDown = () => {
    socket?.emit('game:powerDown');
  };

  const voteDisconnect = (vote: DisconnectVoteOption) => {
    socket?.emit('game:vote-disconnect', vote);
  };

  const setTheme = (theme: ThemeId) => {
    socket?.emit('game:setTheme', theme);
  };

  const addAIPlayer = (difficulty: AIDifficulty) => {
    socket?.emit('game:addAI', difficulty);
  };

  const removeAIPlayer = (aiPlayerId: string) => {
    socket?.emit('game:removeAI', aiPlayerId);
  };

  return {
    createGame,
    joinGame,
    leaveGame,
    startGame,
    programRegister,
    submitProgram,
    togglePowerDown,
    voteDisconnect,
    setTheme,
    addAIPlayer,
    removeAIPlayer,
  };
}
