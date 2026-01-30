import { Board, createEmptyBoard, Tile, ConveyorTile, GearTile } from '@circuit-chaos/shared';

export function createSampleBoard(): Board {
  const board = createEmptyBoard(12, 12, 'Factory Floor');

  // Add spawn points
  board.spawnPoints = [
    { x: 1, y: 10, order: 1 },
    { x: 3, y: 10, order: 2 },
    { x: 5, y: 10, order: 3 },
    { x: 7, y: 10, order: 4 },
    { x: 9, y: 10, order: 5 },
    { x: 10, y: 10, order: 6 },
  ];

  // Add checkpoints (race course)
  board.checkpoints = [
    { x: 5, y: 7, order: 1 },
    { x: 9, y: 3, order: 2 },
    { x: 2, y: 1, order: 3 },
  ];

  // Add some pits
  setTile(board, 3, 5, { type: 'pit' });
  setTile(board, 8, 6, { type: 'pit' });
  setTile(board, 6, 2, { type: 'pit' });

  // Add conveyor belt line (horizontal)
  for (let x = 2; x <= 6; x++) {
    setTile(board, x, 8, {
      type: 'conveyor',
      direction: 'east',
      speed: 1,
    } as ConveyorTile);
  }

  // Add express conveyor (vertical)
  for (let y = 4; y <= 7; y++) {
    setTile(board, 10, y, {
      type: 'conveyor',
      direction: 'north',
      speed: 2,
    } as ConveyorTile);
  }

  // Add gears
  setTile(board, 4, 4, { type: 'gear', rotation: 'cw' } as GearTile);
  setTile(board, 7, 4, { type: 'gear', rotation: 'ccw' } as GearTile);

  // Add repair stations
  setTile(board, 1, 5, { type: 'repair' });
  setTile(board, 10, 1, { type: 'repair' });

  // Add walls
  board.walls = [
    // Some obstacles
    { x: 5, y: 5, side: 'north' },
    { x: 5, y: 5, side: 'east' },
    { x: 2, y: 3, side: 'south' },
    { x: 8, y: 2, side: 'west' },
  ];

  // Add a laser
  board.lasers = [
    { x: 0, y: 4, direction: 'east', strength: 1 },
    { x: 11, y: 6, direction: 'west', strength: 1 },
  ];

  return board;
}

function setTile(board: Board, x: number, y: number, tile: Tile) {
  if (y >= 0 && y < board.height && x >= 0 && x < board.width) {
    board.tiles[y][x] = tile;
  }
}
