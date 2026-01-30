import { useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import { useGameStore } from '../stores/gameStore';
import type { GameState, Card } from '@circuit-chaos/shared';

// Socket events
interface ServerToClientEvents {
  'game:state': (state: GameState) => void;
  'game:created': (data: { gameId: string; playerId: string }) => void;
  'game:joined': (data: { playerId: string }) => void;
  'game:error': (message: string) => void;
}

interface ClientToServerEvents {
  'game:create': (playerName: string) => void;
  'game:join': (gameId: string, playerName: string) => void;
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

  const store = useGameStore.getState();

  socket = io({
    autoConnect: true,
  });

  socket.on('connect', () => {
    console.log('Connected to server');
    useGameStore.getState().setConnected(true);
  });

  socket.on('disconnect', () => {
    console.log('Disconnected from server');
    useGameStore.getState().setConnected(false);
  });

  socket.on('game:created', ({ gameId, playerId }) => {
    console.log('Game created:', gameId);
    useGameStore.getState().setPlayerId(playerId);
    useGameStore.getState().setScreen('lobby');
  });

  socket.on('game:joined', ({ playerId }) => {
    console.log('Joined game as:', playerId);
    useGameStore.getState().setPlayerId(playerId);
    useGameStore.getState().setScreen('lobby');
  });

  socket.on('game:state', (state) => {
    console.log('Game state update:', state.phase);
    useGameStore.getState().setGameState(state);

    if (state.phase !== 'lobby' && useGameStore.getState().screen === 'lobby') {
      useGameStore.getState().setScreen('game');
    }
  });

  socket.on('game:error', (message) => {
    console.error('Game error:', message);
    alert(message);
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
    reset();
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
