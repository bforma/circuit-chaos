import type { Robot } from './robot';
import type { Card } from './card';

export type AIDifficulty = 'easy' | 'medium' | 'hard';

export interface Player {
  id: string;
  name: string;
  color: string;
  robot: Robot;
  hand: Card[];
  registers: (Card | null)[];
  isReady: boolean; // Has submitted their program
  isConnected: boolean;
  disconnectedAt?: number; // Timestamp when player disconnected
  isAI: boolean;
  aiDifficulty?: AIDifficulty;
}

export const PLAYER_COLORS = [
  '#e74c3c', // Red
  '#3498db', // Blue
  '#2ecc71', // Green
  '#f39c12', // Orange
  '#9b59b6', // Purple
  '#1abc9c', // Teal
  '#e91e63', // Pink
  '#00bcd4', // Cyan
] as const;

export interface CreatePlayerOptions {
  isAI?: boolean;
  aiDifficulty?: AIDifficulty;
}

export function createPlayer(
  id: string,
  name: string,
  colorIndex: number,
  options: CreatePlayerOptions = {}
): Omit<Player, 'robot'> {
  return {
    id,
    name,
    color: PLAYER_COLORS[colorIndex % PLAYER_COLORS.length],
    hand: [],
    registers: [null, null, null, null, null],
    isReady: false,
    isConnected: true,
    isAI: options.isAI ?? false,
    aiDifficulty: options.aiDifficulty,
  };
}
