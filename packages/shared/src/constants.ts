// Game constants
export const MAX_DAMAGE = 10;
export const STARTING_LIVES = 3;
export const REGISTERS_COUNT = 5;
export const BASE_HAND_SIZE = 9;

// Card counts in shared deck (legacy 2016 rules)
export const CARD_DISTRIBUTION = {
  move1: 18,
  move2: 12,
  move3: 6,
  backup: 6,
  rotateLeft: 18,
  rotateRight: 18,
  uturn: 6,
} as const;

// Personal deck distribution (2023 rules) - 20 cards per player
export const PERSONAL_DECK_DISTRIBUTION = {
  move1: 4,
  move2: 3,
  move3: 1,
  backup: 1,
  rotateLeft: 4,
  rotateRight: 4,
  uturn: 1,
  powerUp: 1,
  again: 1,
} as const;

// Energy constants (2023 rules)
export const STARTING_ENERGY = 3;
export const MAX_ENERGY = 10;

// Priority ranges for each card type
export const PRIORITY_RANGES = {
  uturn: { min: 10, max: 60 },
  rotateLeft: { min: 70, max: 410 },
  rotateRight: { min: 80, max: 420 },
  backup: { min: 430, max: 480 },
  move1: { min: 490, max: 660 },
  move2: { min: 670, max: 780 },
  move3: { min: 790, max: 840 },
} as const;

// Board defaults
export const DEFAULT_BOARD_WIDTH = 12;
export const DEFAULT_BOARD_HEIGHT = 12;
export const TILE_SIZE = 64; // pixels

// AI player names
export const AI_NAMES = [
  'Sparky',
  'Bolt',
  'Gizmo',
  'Whirr',
  'Clank',
  'Servo',
  'Buzzy',
  'Zappy',
] as const;
