import type { CardType } from './card';

// Game log entry types
export type GameLogEntryType =
  | 'register_start'
  | 'card_played'
  | 'robot_move'
  | 'robot_rotate'
  | 'robot_pushed'
  | 'robot_destroyed'
  | 'conveyor_activated'
  | 'gear_activated'
  | 'laser_hit'
  | 'checkpoint_reached'
  | 'energy_gained'
  | 'register_end'
  | 'round_start'
  | 'round_end'
  | 'game_won';

export interface GameLogEntry {
  id: string;
  type: GameLogEntryType;
  timestamp: number;
  message: string;
  playerId?: string;
  playerName?: string;
  playerColor?: string;
  details?: {
    cardType?: CardType;
    damage?: number;
    checkpointNumber?: number;
    energy?: number;
    registerIndex?: number;
  };
}

// Helper to create log entries
export function createLogEntry(
  type: GameLogEntryType,
  message: string,
  options?: Partial<Omit<GameLogEntry, 'id' | 'type' | 'timestamp' | 'message'>>
): GameLogEntry {
  return {
    id: crypto.randomUUID(),
    type,
    timestamp: Date.now(),
    message,
    ...options,
  };
}

// Format helpers for creating human-readable log messages
export function formatCardPlayed(playerName: string, cardType: CardType): string {
  const cardNames: Record<CardType, string> = {
    move1: 'Move 1',
    move2: 'Move 2',
    move3: 'Move 3',
    backup: 'Back Up',
    rotateLeft: 'Turn Left',
    rotateRight: 'Turn Right',
    uturn: 'U-Turn',
    powerUp: 'Power Up',
    again: 'Again',
    spam: 'SPAM',
    haywireMove1RotateMove1: 'Haywire',
    haywireMove2Sideways: 'Haywire',
    haywireMove3Uturn: 'Haywire',
  };
  return `${playerName} plays ${cardNames[cardType]}`;
}

export function formatRobotPushed(pushedName: string, byName: string): string {
  return `${pushedName} pushed by ${byName}`;
}

export function formatRobotDestroyed(playerName: string, reason: 'pit' | 'off_board' | 'damage'): string {
  switch (reason) {
    case 'pit':
      return `${playerName} fell into a pit!`;
    case 'off_board':
      return `${playerName} fell off the board!`;
    case 'damage':
      return `${playerName} was destroyed by damage!`;
  }
}

export function formatLaserHit(playerName: string, damage: number): string {
  return `${playerName} hit by laser (${damage} damage)`;
}

export function formatCheckpointReached(playerName: string, checkpointNumber: number): string {
  return `${playerName} reached checkpoint ${checkpointNumber}!`;
}

export function formatEnergyGained(playerName: string, amount: number, source: 'battery' | 'power_up'): string {
  const sourceText = source === 'battery' ? 'battery' : 'Power Up card';
  return `${playerName} gained ${amount} energy from ${sourceText}`;
}
