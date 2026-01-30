import { create } from 'zustand';
import type { GameState, Player, Card } from '@circuit-chaos/shared';

type Screen = 'menu' | 'lobby' | 'game';

interface GameStore {
  // UI State
  screen: Screen;
  setScreen: (screen: Screen) => void;

  // Player info
  playerId: string | null;
  playerName: string;
  setPlayerName: (name: string) => void;
  setPlayerId: (id: string) => void;

  // Game state (from server)
  gameState: GameState | null;
  setGameState: (state: GameState | null) => void;

  // Local programming state
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;

  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Helpers
  getCurrentPlayer: () => Player | undefined;
  reset: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // UI State
  screen: 'menu',
  setScreen: (screen) => set({ screen }),

  // Player info
  playerId: null,
  playerName: '',
  setPlayerName: (name) => set({ playerName: name }),
  setPlayerId: (id) => set({ playerId: id }),

  // Game state
  gameState: null,
  setGameState: (gameState) => set({ gameState }),

  // Local programming state
  selectedCard: null,
  setSelectedCard: (card) => set({ selectedCard: card }),

  // Connection state
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),

  // Helpers
  getCurrentPlayer: () => {
    const { gameState, playerId } = get();
    return gameState?.players.find(p => p.id === playerId);
  },

  reset: () => set({
    screen: 'menu',
    gameState: null,
    selectedCard: null,
  }),
}));
