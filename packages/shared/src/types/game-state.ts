import type { Board } from './board';
import type { Player } from './player';

export type GamePhase =
  | 'lobby'
  | 'dealing'
  | 'programming'
  | 'executing'
  | 'cleanup'
  | 'finished';

export interface GameState {
  id: string;
  phase: GamePhase;
  board: Board;
  players: Player[];
  currentRegister: number; // 0-4 during execution
  turn: number;
  hostId: string;
  winnerId?: string;
  maxPlayers: number;
  createdAt: number;
}

export interface GameSettings {
  maxPlayers: number;
  boardId: string;
  timerEnabled: boolean;
  timerSeconds: number;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 4,
  boardId: 'default',
  timerEnabled: true,
  timerSeconds: 60,
};
