import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type { GameState, Card } from '@circuit-chaos/shared';

// Local storage keys
const STORAGE_KEYS = {
  gameId: 'circuit-chaos-gameId',
  playerId: 'circuit-chaos-playerId',
} as const;

// Session helpers
function saveSession(gameId: string, playerId: string) {
  localStorage.setItem(STORAGE_KEYS.gameId, gameId);
  localStorage.setItem(STORAGE_KEYS.playerId, playerId);
}

function getSession() {
  const gameId = localStorage.getItem(STORAGE_KEYS.gameId);
  const playerId = localStorage.getItem(STORAGE_KEYS.playerId);
  return gameId && playerId ? { gameId, playerId } : null;
}

function clearSession() {
  localStorage.removeItem(STORAGE_KEYS.gameId);
  localStorage.removeItem(STORAGE_KEYS.playerId);
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

    // Try to reconnect to existing session
    const session = getSession();
    if (session) {
      console.log('Attempting to reconnect to game:', session.gameId);
      socket?.emit('game:reconnect', session.gameId, session.playerId);
    }
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    useGameStore.getState().setConnected(false);
  });

  socket.on('game:created', ({ gameId, playerId }) => {
    console.log('Game created:', gameId);
    saveSession(gameId, playerId);
    useGameStore.getState().setPlayerId(playerId);
    useGameStore.getState().setScreen('lobby');
  });

  socket.on('game:joined', ({ playerId }) => {
    console.log('Joined game as:', playerId);
    // gameId is already set when joining, get it from the state that will arrive
    useGameStore.getState().setPlayerId(playerId);
    useGameStore.getState().setScreen('lobby');
  });

  socket.on('game:reconnected', ({ gameId, playerId }) => {
    console.log('Reconnected to game:', gameId);
    saveSession(gameId, playerId);
    useGameStore.getState().setPlayerId(playerId);
    // Screen will be set based on game phase when state arrives
  });

  socket.on('game:state', (state) => {
    console.log('Game state update:', state.phase);
    useGameStore.getState().setGameState(state);

    // Save session when we receive state (for join scenario)
    const playerId = useGameStore.getState().playerId;
    if (playerId) {
      saveSession(state.id, playerId);
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
    // Clear session if game not found or player not found
    if (message.includes('not found')) {
      clearSession();
    }
    // Only alert if we're not trying to reconnect silently
    if (useGameStore.getState().screen !== 'menu') {
      alert(message);
    }
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
    socket?.emit('game:join', gameId, playerName);
  };

  const leaveGame = () => {
    socket?.emit('game:leave');
    clearSession();
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

  return {
    createGame,
    joinGame,
    leaveGame,
    startGame,
    programRegister,
    submitProgram,
  };
}
