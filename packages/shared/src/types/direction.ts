export type Direction = 'north' | 'east' | 'south' | 'west';

export const DIRECTIONS: Direction[] = ['north', 'east', 'south', 'west'];

export function rotateDirection(dir: Direction, rotation: 'cw' | 'ccw' | 'uturn'): Direction {
  const index = DIRECTIONS.indexOf(dir);
  switch (rotation) {
    case 'cw':
      return DIRECTIONS[(index + 1) % 4];
    case 'ccw':
      return DIRECTIONS[(index + 3) % 4];
    case 'uturn':
      return DIRECTIONS[(index + 2) % 4];
  }
}

export function getDirectionDelta(dir: Direction): { dx: number; dy: number } {
  switch (dir) {
    case 'north': return { dx: 0, dy: -1 };
    case 'east': return { dx: 1, dy: 0 };
    case 'south': return { dx: 0, dy: 1 };
    case 'west': return { dx: -1, dy: 0 };
  }
}
