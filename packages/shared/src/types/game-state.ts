import type { Board } from './board';
import type { Player } from './player';
import type { DisconnectVote } from './disconnect-vote';
import type { ThemeId } from './theme';
import { DEFAULT_THEME } from './theme';

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
  theme: ThemeId;
  disconnectVote?: DisconnectVote; // Active vote about a disconnected player
  cardPreviewEnabled: boolean; // Show ghost preview when hovering cards
}

export interface GameSettings {
  maxPlayers: number;
  boardId: string;
  timerEnabled: boolean;
  timerSeconds: number;
  theme: ThemeId;
}

export const DEFAULT_GAME_SETTINGS: GameSettings = {
  maxPlayers: 4,
  boardId: 'default',
  timerEnabled: true,
  timerSeconds: 60,
  theme: DEFAULT_THEME,
};
