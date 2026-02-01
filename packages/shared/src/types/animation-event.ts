import type { Direction } from './direction';
import type { Card } from './card';

// Animation event types
export type AnimationEventType =
  | 'register_start'      // Register begins
  | 'player_card'         // Player plays card (show overlay)
  | 'robot_move'          // Robot moves 1 tile
  | 'robot_rotate'        // Robot rotates
  | 'robot_pushed'        // Robot pushed by another
  | 'robot_destroyed'     // Robot destroyed (pit/off-board)
  | 'conveyor_move'       // Conveyor moves robots
  | 'gear_rotate'         // Gear rotates robots
  | 'laser_fire'          // Laser fires
  | 'laser_hit'           // Laser hits robot
  | 'checkpoint_reached'  // Checkpoint reached
  | 'energy_gained'       // Energy gained
  | 'register_end';       // Register complete

// Base event structure
interface BaseAnimationEvent {
  type: AnimationEventType;
  timestamp: number; // Relative time from register start (ms)
}

// Register start/end events
export interface RegisterStartEvent extends BaseAnimationEvent {
  type: 'register_start';
  registerIndex: number;
}

export interface RegisterEndEvent extends BaseAnimationEvent {
  type: 'register_end';
  registerIndex: number;
}

// Player card event
export interface PlayerCardEvent extends BaseAnimationEvent {
  type: 'player_card';
  playerId: string;
  playerName: string;
  playerColor: string;
  card: Card;
}

// Robot movement event
export interface RobotMoveEvent extends BaseAnimationEvent {
  type: 'robot_move';
  playerId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  direction: Direction;
}

// Robot rotation event
export interface RobotRotateEvent extends BaseAnimationEvent {
  type: 'robot_rotate';
  playerId: string;
  fromDirection: Direction;
  toDirection: Direction;
  rotation: 'cw' | 'ccw' | 'uturn';
}

// Robot pushed event
export interface RobotPushedEvent extends BaseAnimationEvent {
  type: 'robot_pushed';
  playerId: string;
  pushedByPlayerId: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  direction: Direction;
}

// Robot destroyed event
export interface RobotDestroyedEvent extends BaseAnimationEvent {
  type: 'robot_destroyed';
  playerId: string;
  reason: 'pit' | 'off_board' | 'damage';
  x: number;
  y: number;
}

// Conveyor movement event
export interface ConveyorMoveEvent extends BaseAnimationEvent {
  type: 'conveyor_move';
  movements: Array<{
    playerId: string;
    fromX: number;
    fromY: number;
    toX: number;
    toY: number;
    direction: Direction;
    rotation?: 'cw' | 'ccw'; // For corner conveyors
  }>;
}

// Gear rotation event
export interface GearRotateEvent extends BaseAnimationEvent {
  type: 'gear_rotate';
  rotations: Array<{
    playerId: string;
    rotation: 'cw' | 'ccw';
    fromDirection: Direction;
    toDirection: Direction;
  }>;
}

// Laser fire event
export interface LaserFireEvent extends BaseAnimationEvent {
  type: 'laser_fire';
  lasers: Array<{
    sourceType: 'board' | 'robot';
    sourcePlayerId?: string; // For robot lasers
    startX: number;
    startY: number;
    endX: number;
    endY: number;
    direction: Direction;
    strength: number;
  }>;
}

// Laser hit event
export interface LaserHitEvent extends BaseAnimationEvent {
  type: 'laser_hit';
  playerId: string;
  damage: number;
  x: number;
  y: number;
}

// Checkpoint reached event
export interface CheckpointReachedEvent extends BaseAnimationEvent {
  type: 'checkpoint_reached';
  playerId: string;
  checkpointNumber: number;
  x: number;
  y: number;
}

// Energy gained event
export interface EnergyGainedEvent extends BaseAnimationEvent {
  type: 'energy_gained';
  playerId: string;
  amount: number;
  source: 'battery' | 'power_up';
}

// Union type for all animation events
export type AnimationEvent =
  | RegisterStartEvent
  | RegisterEndEvent
  | PlayerCardEvent
  | RobotMoveEvent
  | RobotRotateEvent
  | RobotPushedEvent
  | RobotDestroyedEvent
  | ConveyorMoveEvent
  | GearRotateEvent
  | LaserFireEvent
  | LaserHitEvent
  | CheckpointReachedEvent
  | EnergyGainedEvent;

// Animation timing constants (ms)
export const ANIMATION_DURATIONS = {
  CARD_DISPLAY: 500,           // Show card overlay
  ROBOT_MOVE_PER_TILE: 250,    // Per tile movement
  ROBOT_ROTATION: 200,         // Rotation animation
  CONVEYOR_MOVE: 300,          // Conveyor belt movement
  GEAR_ROTATION: 200,          // Gear rotation
  LASER_FIRE: 400,             // Laser beam animation
  BETWEEN_PLAYERS: 200,        // Pause between players
  REGISTER_PAUSE: 300,         // Pause between registers
} as const;

// Calculate total duration for a sequence of events
export function calculateEventsDuration(events: AnimationEvent[]): number {
  if (events.length === 0) return 0;
  const lastEvent = events[events.length - 1];
  // Add buffer for the last animation to complete
  return lastEvent.timestamp + ANIMATION_DURATIONS.LASER_FIRE;
}
