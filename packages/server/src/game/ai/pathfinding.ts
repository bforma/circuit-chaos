import type {
  GameState,
  Player,
  Card,
  Direction,
  Position,
  Board,
} from '@circuit-chaos/shared';
import {
  rotateDirection,
  getDirectionDelta,
} from '@circuit-chaos/shared';

export interface SimulatedPosition {
  x: number;
  y: number;
  direction: Direction;
  damage: number;
  isDestroyed: boolean;
}

/**
 * Find Manhattan distance to the next checkpoint
 */
export function distanceToCheckpoint(
  position: Position,
  state: GameState,
  lastCheckpoint: number
): number {
  const nextCheckpoint = state.board.checkpoints.find(
    cp => cp.order === lastCheckpoint + 1
  );
  if (!nextCheckpoint) {
    return 0; // Already finished or no checkpoints
  }
  return Math.abs(position.x - nextCheckpoint.x) + Math.abs(position.y - nextCheckpoint.y);
}

/**
 * Check if a position is on a hazard (pit or off-board)
 */
export function isHazard(board: Board, x: number, y: number): boolean {
  if (x < 0 || x >= board.width || y < 0 || y >= board.height) {
    return true; // Off board
  }
  const tile = board.tiles[y]?.[x];
  return tile?.type === 'pit';
}

/**
 * Check if wall blocks movement from (x,y) in given direction
 */
export function isWallBlocking(
  board: Board,
  x: number,
  y: number,
  direction: Direction
): boolean {
  // Check wall on current tile's exit side
  const exitWall = board.walls.find(
    w => w.x === x && w.y === y && w.side === direction
  );
  if (exitWall) return true;

  // Check wall on target tile's entry side
  const delta = getDirectionDelta(direction);
  const targetX = x + delta.dx;
  const targetY = y + delta.dy;
  const oppositeSide = rotateDirection(direction, 'uturn');

  const entryWall = board.walls.find(
    w => w.x === targetX && w.y === targetY && w.side === oppositeSide
  );

  return !!entryWall;
}

/**
 * Simulate the effect of a single card on a robot's position
 * Returns the new position after applying the card (without board effects)
 */
export function simulateCard(
  state: GameState,
  position: SimulatedPosition,
  card: Card
): SimulatedPosition {
  const result = { ...position };

  switch (card.type) {
    case 'move1':
      moveSimulated(state.board, result, 1);
      break;
    case 'move2':
      moveSimulated(state.board, result, 2);
      break;
    case 'move3':
      moveSimulated(state.board, result, 3);
      break;
    case 'backup':
      moveSimulated(state.board, result, -1);
      break;
    case 'rotateLeft':
      result.direction = rotateDirection(result.direction, 'ccw');
      break;
    case 'rotateRight':
      result.direction = rotateDirection(result.direction, 'cw');
      break;
    case 'uturn':
      result.direction = rotateDirection(result.direction, 'uturn');
      break;
  }

  return result;
}

function moveSimulated(
  board: Board,
  position: SimulatedPosition,
  steps: number
): void {
  const direction = steps < 0
    ? rotateDirection(position.direction, 'uturn')
    : position.direction;
  const delta = getDirectionDelta(direction);
  const absSteps = Math.abs(steps);

  for (let i = 0; i < absSteps; i++) {
    if (isWallBlocking(board, position.x, position.y, direction)) {
      break;
    }

    const newX = position.x + delta.dx;
    const newY = position.y + delta.dy;

    if (isHazard(board, newX, newY)) {
      position.isDestroyed = true;
      break;
    }

    position.x = newX;
    position.y = newY;
  }
}

/**
 * Simulate conveyor belt movement
 */
export function simulateConveyors(
  board: Board,
  position: SimulatedPosition
): void {
  const tile = board.tiles[position.y]?.[position.x];
  if (tile?.type !== 'conveyor') return;

  // Express conveyors move twice
  const moves = tile.speed === 2 ? 2 : 1;

  for (let i = 0; i < moves; i++) {
    const currentTile = board.tiles[position.y]?.[position.x];
    if (currentTile?.type !== 'conveyor') break;

    const delta = getDirectionDelta(currentTile.direction);
    const newX = position.x + delta.dx;
    const newY = position.y + delta.dy;

    if (!isHazard(board, newX, newY)) {
      position.x = newX;
      position.y = newY;

      // Handle turn direction
      if (currentTile.turnDirection) {
        position.direction = rotateDirection(position.direction, currentTile.turnDirection);
      }
    }
  }

  // Check if we landed on a pit
  if (isHazard(board, position.x, position.y)) {
    position.isDestroyed = true;
  }
}

/**
 * Simulate gear rotation
 */
export function simulateGears(board: Board, position: SimulatedPosition): void {
  const tile = board.tiles[position.y]?.[position.x];
  if (tile?.type === 'gear') {
    position.direction = rotateDirection(position.direction, tile.rotation);
  }
}

/**
 * Check if robot is in a laser path (simplified - just checks if on laser tile)
 */
export function isInLaserPath(board: Board, x: number, y: number): boolean {
  return board.lasers.some(laser => {
    const delta = getDirectionDelta(laser.direction);
    let lx = laser.x;
    let ly = laser.y;

    while (lx >= 0 && lx < board.width && ly >= 0 && ly < board.height) {
      if (lx === x && ly === y) return true;
      if (isWallBlocking(board, lx, ly, laser.direction)) break;
      lx += delta.dx;
      ly += delta.dy;
    }
    return false;
  });
}

/**
 * Evaluate a position based on multiple factors
 * Higher score = better position
 */
export function evaluatePosition(
  state: GameState,
  position: SimulatedPosition,
  player: Player
): number {
  if (position.isDestroyed) {
    return -1000;
  }

  let score = 0;

  // Distance to next checkpoint (lower is better)
  const dist = distanceToCheckpoint(
    { x: position.x, y: position.y },
    state,
    player.robot.lastCheckpoint
  );
  score -= dist * 10;

  // Check if on checkpoint
  const nextCheckpoint = state.board.checkpoints.find(
    cp => cp.order === player.robot.lastCheckpoint + 1
  );
  if (nextCheckpoint && position.x === nextCheckpoint.x && position.y === nextCheckpoint.y) {
    score += 500; // Big bonus for reaching checkpoint
  }

  // Hazard avoidance
  if (isInLaserPath(state.board, position.x, position.y)) {
    score -= 50;
  }

  // Damage penalty
  score -= position.damage * 5;

  // Prefer repair tiles
  const tile = state.board.tiles[position.y]?.[position.x];
  if (tile?.type === 'repair' && position.damage > 0) {
    score += 30;
  }

  return score;
}

/**
 * Simulate a full sequence of cards and board effects
 */
export function simulateCardSequence(
  state: GameState,
  player: Player,
  cards: (Card | null)[]
): SimulatedPosition {
  let position: SimulatedPosition = {
    x: player.robot.position.x,
    y: player.robot.position.y,
    direction: player.robot.direction,
    damage: player.robot.damage,
    isDestroyed: false,
  };

  for (const card of cards) {
    if (!card || position.isDestroyed) continue;

    // Apply card
    position = simulateCard(state, position, card);

    // Apply board effects
    if (!position.isDestroyed) {
      simulateConveyors(state.board, position);
    }
    if (!position.isDestroyed) {
      simulateGears(state.board, position);
    }
    // Simplified laser check
    if (!position.isDestroyed && isInLaserPath(state.board, position.x, position.y)) {
      position.damage++;
      if (position.damage >= 10) {
        position.isDestroyed = true;
      }
    }
  }

  return position;
}
