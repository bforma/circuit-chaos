import type { Tile, Wall, Laser, Checkpoint, RebootToken } from './tile';

export interface SpawnPoint {
  x: number;
  y: number;
  order: number; // Starting position priority
}

export interface Board {
  id: string;
  name: string;
  width: number;
  height: number;
  tiles: Tile[][];
  walls: Wall[];
  lasers: Laser[];
  checkpoints: Checkpoint[];
  spawnPoints: SpawnPoint[];
  rebootToken?: RebootToken; // Where destroyed robots respawn (2023 rules)
}

export function createEmptyBoard(width: number, height: number, name: string = 'Custom Board'): Board {
  const tiles: Tile[][] = [];
  for (let y = 0; y < height; y++) {
    tiles[y] = [];
    for (let x = 0; x < width; x++) {
      tiles[y][x] = { type: 'floor' };
    }
  }

  return {
    id: crypto.randomUUID(),
    name,
    width,
    height,
    tiles,
    walls: [],
    lasers: [],
    checkpoints: [],
    spawnPoints: [],
  };
}
