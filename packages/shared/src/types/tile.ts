import type { Direction } from './direction';

export type TileType = 'floor' | 'pit' | 'repair' | 'conveyor' | 'gear' | 'battery';

export interface BaseTile {
  type: TileType;
}

export interface FloorTile extends BaseTile {
  type: 'floor';
}

export interface PitTile extends BaseTile {
  type: 'pit';
}

export interface RepairTile extends BaseTile {
  type: 'repair';
}

export interface ConveyorTile extends BaseTile {
  type: 'conveyor';
  direction: Direction;
  speed: 1 | 2;
  turnDirection?: 'cw' | 'ccw'; // For corner conveyors
}

export interface GearTile extends BaseTile {
  type: 'gear';
  rotation: 'cw' | 'ccw';
}

export interface BatteryTile extends BaseTile {
  type: 'battery';
}

export type Tile = FloorTile | PitTile | RepairTile | ConveyorTile | GearTile | BatteryTile;

export interface Wall {
  x: number;
  y: number;
  side: Direction; // Which side of the tile the wall is on
}

export interface Laser {
  x: number;
  y: number;
  direction: Direction;
  strength: number; // 1, 2, or 3 damage
}

export interface Checkpoint {
  x: number;
  y: number;
  order: number; // 1, 2, 3, etc.
}

export interface RebootToken {
  x: number;
  y: number;
  pushDirection: Direction; // Direction to push robots if spawn is occupied
}
