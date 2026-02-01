import { create } from 'zustand';
import type {
  GameState,
  Player,
  Card,
  AnimationEvent,
  GameLogEntry,
  PlayerCardEvent,
  RobotMoveEvent,
  RobotRotateEvent,
  RobotPushedEvent,
  RobotDestroyedEvent,
  CheckpointReachedEvent,
  EnergyGainedEvent,
  LaserHitEvent,
} from '@circuit-chaos/shared';
import {
  formatCardPlayed,
  formatRobotPushed,
  formatRobotDestroyed,
  formatLaserHit,
  formatCheckpointReached,
  formatEnergyGained,
  createLogEntry,
} from '@circuit-chaos/shared';

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

  // Join state (for URL-based joining)
  gameIdToJoin: string | null;
  setGameIdToJoin: (gameId: string | null) => void;

  // Local programming state
  selectedCard: Card | null;
  setSelectedCard: (card: Card | null) => void;
  hoveredCard: Card | null;
  setHoveredCard: (card: Card | null) => void;

  // Connection state
  isConnected: boolean;
  setConnected: (connected: boolean) => void;

  // Error state
  error: string | null;
  setError: (error: string | null) => void;

  // Game log state
  gameLog: GameLogEntry[];
  addLogEntry: (entry: GameLogEntry) => void;
  addLogEntryFromEvent: (event: AnimationEvent) => void;
  clearGameLog: () => void;

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

  // Join state
  gameIdToJoin: null,
  setGameIdToJoin: (gameIdToJoin) => set({ gameIdToJoin }),

  // Local programming state
  selectedCard: null,
  setSelectedCard: (card) => set({ selectedCard: card }),
  hoveredCard: null,
  setHoveredCard: (card) => set({ hoveredCard: card }),

  // Connection state
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),

  // Error state
  error: null,
  setError: (error) => set({ error }),

  // Game log state
  gameLog: [],
  addLogEntry: (entry) => set((state) => ({
    gameLog: [...state.gameLog.slice(-99), entry], // Keep last 100 entries
  })),
  addLogEntryFromEvent: (event) => {
    const { gameState, addLogEntry } = get();
    if (!gameState) return;

    const getPlayer = (playerId: string) => gameState.players.find(p => p.id === playerId);

    switch (event.type) {
      case 'register_start':
        addLogEntry(createLogEntry('register_start', `Register ${event.registerIndex + 1} begins`, {
          details: { registerIndex: event.registerIndex },
        }));
        break;

      case 'player_card': {
        const cardEvent = event as PlayerCardEvent;
        addLogEntry(createLogEntry('card_played', formatCardPlayed(cardEvent.playerName, cardEvent.card.type), {
          playerId: cardEvent.playerId,
          playerName: cardEvent.playerName,
          playerColor: cardEvent.playerColor,
          details: { cardType: cardEvent.card.type },
        }));
        break;
      }

      case 'robot_pushed': {
        const pushEvent = event as RobotPushedEvent;
        const pushedPlayer = getPlayer(pushEvent.playerId);
        const pusherPlayer = getPlayer(pushEvent.pushedByPlayerId);
        if (pushedPlayer && pusherPlayer) {
          addLogEntry(createLogEntry('robot_pushed', formatRobotPushed(pushedPlayer.name, pusherPlayer.name), {
            playerId: pushEvent.playerId,
            playerName: pushedPlayer.name,
            playerColor: pushedPlayer.color,
          }));
        }
        break;
      }

      case 'robot_destroyed': {
        const destroyEvent = event as RobotDestroyedEvent;
        const player = getPlayer(destroyEvent.playerId);
        if (player) {
          addLogEntry(createLogEntry('robot_destroyed', formatRobotDestroyed(player.name, destroyEvent.reason), {
            playerId: destroyEvent.playerId,
            playerName: player.name,
            playerColor: player.color,
          }));
        }
        break;
      }

      case 'laser_hit': {
        const hitEvent = event as LaserHitEvent;
        const player = getPlayer(hitEvent.playerId);
        if (player) {
          addLogEntry(createLogEntry('laser_hit', formatLaserHit(player.name, hitEvent.damage), {
            playerId: hitEvent.playerId,
            playerName: player.name,
            playerColor: player.color,
            details: { damage: hitEvent.damage },
          }));
        }
        break;
      }

      case 'checkpoint_reached': {
        const cpEvent = event as CheckpointReachedEvent;
        const player = getPlayer(cpEvent.playerId);
        if (player) {
          addLogEntry(createLogEntry('checkpoint_reached', formatCheckpointReached(player.name, cpEvent.checkpointNumber), {
            playerId: cpEvent.playerId,
            playerName: player.name,
            playerColor: player.color,
            details: { checkpointNumber: cpEvent.checkpointNumber },
          }));
        }
        break;
      }

      case 'energy_gained': {
        const energyEvent = event as EnergyGainedEvent;
        const player = getPlayer(energyEvent.playerId);
        if (player) {
          addLogEntry(createLogEntry('energy_gained', formatEnergyGained(player.name, energyEvent.amount, energyEvent.source), {
            playerId: energyEvent.playerId,
            playerName: player.name,
            playerColor: player.color,
            details: { energy: energyEvent.amount },
          }));
        }
        break;
      }

      case 'register_end':
        addLogEntry(createLogEntry('register_end', `Register ${event.registerIndex + 1} complete`, {
          details: { registerIndex: event.registerIndex },
        }));
        break;

      // Other event types don't need log entries
      default:
        break;
    }
  },
  clearGameLog: () => set({ gameLog: [] }),

  // Helpers
  getCurrentPlayer: () => {
    const { gameState, playerId } = get();
    return gameState?.players.find(p => p.id === playerId);
  },

  reset: () => set({
    screen: 'menu',
    playerId: null,
    gameState: null,
    gameIdToJoin: null,
    selectedCard: null,
    hoveredCard: null,
    error: null,
    gameLog: [],
  }),
}));
