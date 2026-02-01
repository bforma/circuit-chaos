import type {
  Card,
  Player,
  Board,
  Direction,
} from '@circuit-chaos/shared';
import { rotateDirection, getDirectionDelta, isDamageCard } from '@circuit-chaos/shared';

export interface PreviewPosition {
  x: number;
  y: number;
  direction: Direction;
  isDestroyed: boolean;
}

/**
 * Calculate the preview position after playing a sequence of cards
 * This is a simplified simulation that doesn't account for other robots or board lasers
 */
export function calculatePreviewPosition(
  player: Player,
  board: Board,
  cardsToSimulate: (Card | null)[]
): PreviewPosition {
  let position: PreviewPosition = {
    x: player.robot.position.x,
    y: player.robot.position.y,
    direction: player.robot.direction,
    isDestroyed: player.robot.isDestroyed,
  };

  let previousCard: Card | null = null;

  for (const card of cardsToSimulate) {
    if (!card || position.isDestroyed) continue;

    // Apply card effect (pass previous card for Again card handling)
    position = applyCard(position, card, board, previousCard);

    // Apply board effects (conveyors, gears)
    if (!position.isDestroyed) {
      position = applyConveyors(position, board);
    }
    if (!position.isDestroyed) {
      position = applyGears(position, board);
    }

    // Track previous card for Again (skip damage cards and again cards)
    if (card.type !== 'again' && !isDamageCard(card.type)) {
      previousCard = card;
    }
  }

  return position;
}

function applyCard(
  pos: PreviewPosition,
  card: Card,
  board: Board,
  previousCard: Card | null
): PreviewPosition {
  const result = { ...pos };

  // Handle Again card by repeating previous card's effect
  const effectiveCard = card.type === 'again' && previousCard ? previousCard : card;

  switch (effectiveCard.type) {
    case 'move1':
      movePosition(result, 1, board);
      break;
    case 'move2':
      movePosition(result, 2, board);
      break;
    case 'move3':
      movePosition(result, 3, board);
      break;
    case 'backup':
      movePosition(result, -1, board);
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
    // again without previous card, or damage cards: no movement effect
  }

  return result;
}

function movePosition(
  pos: PreviewPosition,
  steps: number,
  board: Board
): void {
  const direction = steps < 0
    ? rotateDirection(pos.direction, 'uturn')
    : pos.direction;
  const delta = getDirectionDelta(direction);
  const absSteps = Math.abs(steps);

  for (let i = 0; i < absSteps; i++) {
    // Check wall blocking exit
    if (isWallBlocking(board, pos.x, pos.y, direction)) {
      break;
    }

    const newX = pos.x + delta.dx;
    const newY = pos.y + delta.dy;

    // Check bounds
    if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
      pos.isDestroyed = true;
      break;
    }

    // Check wall blocking entry
    const oppositeDir = rotateDirection(direction, 'uturn');
    if (isWallBlocking(board, newX, newY, oppositeDir)) {
      break;
    }

    pos.x = newX;
    pos.y = newY;

    // Check pit
    const tile = board.tiles[newY]?.[newX];
    if (tile?.type === 'pit') {
      pos.isDestroyed = true;
      break;
    }
  }
}

function isWallBlocking(
  board: Board,
  x: number,
  y: number,
  direction: Direction
): boolean {
  return board.walls.some(w => w.x === x && w.y === y && w.side === direction);
}

function applyConveyors(pos: PreviewPosition, board: Board): PreviewPosition {
  const result = { ...pos };
  const tile = board.tiles[result.y]?.[result.x];

  if (tile?.type !== 'conveyor') return result;

  // Move by conveyor (express conveyors move twice)
  const moves = tile.speed === 2 ? 2 : 1;

  for (let i = 0; i < moves; i++) {
    const currentTile = board.tiles[result.y]?.[result.x];
    if (currentTile?.type !== 'conveyor') break;

    const delta = getDirectionDelta(currentTile.direction);
    const newX = result.x + delta.dx;
    const newY = result.y + delta.dy;

    // Check bounds
    if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
      result.isDestroyed = true;
      break;
    }

    result.x = newX;
    result.y = newY;

    // Check pit
    const newTile = board.tiles[newY]?.[newX];
    if (newTile?.type === 'pit') {
      result.isDestroyed = true;
      break;
    }

    // Apply turn direction
    if (currentTile.turnDirection) {
      result.direction = rotateDirection(result.direction, currentTile.turnDirection);
    }
  }

  return result;
}

function applyGears(pos: PreviewPosition, board: Board): PreviewPosition {
  const result = { ...pos };
  const tile = board.tiles[result.y]?.[result.x];

  if (tile?.type === 'gear') {
    result.direction = rotateDirection(result.direction, tile.rotation);
  }

  return result;
}
