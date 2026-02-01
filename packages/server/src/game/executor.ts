import {
  GameState,
  Player,
  Card,
  Direction,
  rotateDirection,
  getDirectionDelta,
  MAX_ENERGY,
} from '@circuit-chaos/shared';

interface Movement {
  player: Player;
  card: Card;
}

/**
 * Get execution order: clockwise from priority token holder
 */
function getExecutionOrder(state: GameState): string[] {
  const priorityIndex = state.players.findIndex(p => p.id === state.priorityPlayerId);
  if (priorityIndex === -1) {
    // Fallback: use natural order
    return state.players.map(p => p.id);
  }

  // Rotate array so priority player is first
  const order: string[] = [];
  for (let i = 0; i < state.players.length; i++) {
    const index = (priorityIndex + i) % state.players.length;
    order.push(state.players[index].id);
  }
  return order;
}

export function executeRegister(state: GameState, registerIndex: number) {
  // Get clockwise execution order starting from priority token holder
  const executionOrder = getExecutionOrder(state);

  // Collect all movements for this register
  const movements: Movement[] = [];

  for (const player of state.players) {
    const card = player.registers[registerIndex];
    // Skip destroyed or powered down robots
    if (card && !player.robot.isDestroyed && !player.robot.isPoweredDown) {
      movements.push({ player, card });
    }
  }

  // Sort by player execution order (clockwise from priority holder)
  movements.sort((a, b) => {
    return executionOrder.indexOf(a.player.id) - executionOrder.indexOf(b.player.id);
  });

  // Execute each movement
  for (const { player, card } of movements) {
    executeCard(state, player, card, registerIndex);
  }

  // After all cards: execute board elements
  executeConveyors(state);
  executeGears(state);
  executeLasers(state);
  executeCheckpoints(state);
}

function executeCard(state: GameState, player: Player, card: Card, registerIndex: number) {
  const { robot } = player;

  switch (card.type) {
    case 'move1':
      moveRobot(state, player, 1);
      break;
    case 'move2':
      moveRobot(state, player, 2);
      break;
    case 'move3':
      moveRobot(state, player, 3);
      break;
    case 'backup':
      moveRobot(state, player, -1);
      break;
    case 'rotateLeft':
      robot.direction = rotateDirection(robot.direction, 'ccw');
      break;
    case 'rotateRight':
      robot.direction = rotateDirection(robot.direction, 'cw');
      break;
    case 'uturn':
      robot.direction = rotateDirection(robot.direction, 'uturn');
      break;
    case 'powerUp':
      // Gain 1 energy (capped at MAX_ENERGY)
      player.robot.energy = Math.min((player.robot.energy ?? 0) + 1, MAX_ENERGY);
      break;
    case 'again':
      // Repeat the previous register's card
      if (registerIndex > 0) {
        const previousCard = player.registers[registerIndex - 1];
        if (previousCard && previousCard.type !== 'again') {
          executeCard(state, player, previousCard, registerIndex);
        }
      }
      // In register 1, Again acts like a random card (handled elsewhere in 2023 rules)
      break;
  }
}

function moveRobot(state: GameState, player: Player, steps: number) {
  const { robot } = player;
  const { board } = state;

  const direction = steps < 0
    ? rotateDirection(robot.direction, 'uturn')
    : robot.direction;
  const delta = getDirectionDelta(direction);
  const absSteps = Math.abs(steps);

  for (let i = 0; i < absSteps; i++) {
    const newX = robot.position.x + delta.dx;
    const newY = robot.position.y + delta.dy;

    // Check wall collision
    if (isWallBlocking(board, robot.position.x, robot.position.y, direction)) {
      break;
    }

    // Check bounds
    if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
      // Fell off the board
      destroyRobot(player);
      break;
    }

    // Check for other robots (push)
    const blockingPlayer = state.players.find(p =>
      !p.robot.isDestroyed &&
      p.id !== player.id &&
      p.robot.position.x === newX &&
      p.robot.position.y === newY
    );

    if (blockingPlayer) {
      // Try to push
      if (!pushRobot(state, blockingPlayer, direction)) {
        break; // Can't push, stop movement
      }
    }

    // Move robot
    robot.position.x = newX;
    robot.position.y = newY;

    // Check for pit
    const tile = board.tiles[newY]?.[newX];
    if (tile?.type === 'pit') {
      destroyRobot(player);
      break;
    }
  }
}

function pushRobot(state: GameState, player: Player, direction: Direction): boolean {
  const { robot } = player;
  const { board } = state;
  const delta = getDirectionDelta(direction);

  const newX = robot.position.x + delta.dx;
  const newY = robot.position.y + delta.dy;

  // Check wall
  if (isWallBlocking(board, robot.position.x, robot.position.y, direction)) {
    return false;
  }

  // Check bounds
  if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
    destroyRobot(player);
    return true;
  }

  // Check chain push
  const nextBlockingPlayer = state.players.find(p =>
    !p.robot.isDestroyed &&
    p.id !== player.id &&
    p.robot.position.x === newX &&
    p.robot.position.y === newY
  );

  if (nextBlockingPlayer) {
    if (!pushRobot(state, nextBlockingPlayer, direction)) {
      return false;
    }
  }

  robot.position.x = newX;
  robot.position.y = newY;

  // Check pit
  const tile = board.tiles[newY]?.[newX];
  if (tile?.type === 'pit') {
    destroyRobot(player);
  }

  return true;
}

function isWallBlocking(board: any, x: number, y: number, direction: Direction): boolean {
  // Check wall on current tile's exit side
  const exitWall = board.walls.find((w: any) =>
    w.x === x && w.y === y && w.side === direction
  );
  if (exitWall) return true;

  // Check wall on target tile's entry side
  const delta = getDirectionDelta(direction);
  const targetX = x + delta.dx;
  const targetY = y + delta.dy;
  const oppositeSide = rotateDirection(direction, 'uturn');

  const entryWall = board.walls.find((w: any) =>
    w.x === targetX && w.y === targetY && w.side === oppositeSide
  );

  return !!entryWall;
}

function destroyRobot(player: Player) {
  player.robot.isDestroyed = true;
  player.robot.lives--;
  // Robot stays destroyed for the rest of the round
  // Respawn happens in respawnDestroyedRobots() during cleanup phase
}

export function respawnDestroyedRobots(state: GameState) {
  for (const player of state.players) {
    if (player.robot.isDestroyed && player.robot.lives > 0) {
      // Respawn at last checkpoint or spawn
      player.robot.position = { ...player.robot.spawnPosition };
      player.robot.isDestroyed = false;
      player.robot.damage = 2; // Respawn with some damage
      // Clear all registers for next round
      player.registers = [null, null, null, null, null];
    }
  }
}

export function processPowerDown(state: GameState) {
  for (const player of state.players) {
    if (player.robot.isDestroyed) continue;

    // Heal robots that were powered down this round
    if (player.robot.isPoweredDown) {
      player.robot.damage = 0;
      player.robot.isPoweredDown = false;
    }

    // Apply announced power down for next round
    if (player.robot.willPowerDown) {
      player.robot.isPoweredDown = true;
      player.robot.willPowerDown = false;
    }
  }
}

function executeConveyors(state: GameState) {
  const { board, players } = state;

  // First pass: express conveyors (speed 2)
  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'conveyor' && tile.speed === 2) {
      moveByConveyor(state, player, tile.direction);
    }
  }

  // Second pass: all conveyors
  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'conveyor') {
      moveByConveyor(state, player, tile.direction);

      // Check for rotation on corner conveyors
      if (tile.turnDirection) {
        player.robot.direction = rotateDirection(player.robot.direction, tile.turnDirection);
      }
    }
  }
}

function moveByConveyor(state: GameState, player: Player, direction: Direction) {
  const delta = getDirectionDelta(direction);
  const newX = player.robot.position.x + delta.dx;
  const newY = player.robot.position.y + delta.dy;

  // Don't push other robots with conveyors
  const blocked = state.players.some(p =>
    !p.robot.isDestroyed &&
    p.id !== player.id &&
    p.robot.position.x === newX &&
    p.robot.position.y === newY
  );

  if (!blocked && newX >= 0 && newX < state.board.width && newY >= 0 && newY < state.board.height) {
    player.robot.position.x = newX;
    player.robot.position.y = newY;

    // Check pit
    const tile = state.board.tiles[newY]?.[newX];
    if (tile?.type === 'pit') {
      destroyRobot(player);
    }
  }
}

function executeGears(state: GameState) {
  const { board, players } = state;

  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'gear') {
      player.robot.direction = rotateDirection(player.robot.direction, tile.rotation);
    }
  }
}

function executeLasers(state: GameState) {
  const { board, players } = state;

  // Board lasers
  for (const laser of board.lasers) {
    const delta = getDirectionDelta(laser.direction);
    let x = laser.x;
    let y = laser.y;

    while (x >= 0 && x < board.width && y >= 0 && y < board.height) {
      const hitPlayer = players.find(p =>
        !p.robot.isDestroyed &&
        p.robot.position.x === x &&
        p.robot.position.y === y
      );

      if (hitPlayer) {
        hitPlayer.robot.damage += laser.strength;
        if (hitPlayer.robot.damage >= 10) {
          destroyRobot(hitPlayer);
        }
        break;
      }

      // Check for wall blocking
      if (isWallBlocking(board, x, y, laser.direction)) {
        break;
      }

      x += delta.dx;
      y += delta.dy;
    }
  }

  // Robot lasers
  for (const shooter of players) {
    if (shooter.robot.isDestroyed) continue;

    const { direction, position } = shooter.robot;
    const delta = getDirectionDelta(direction);
    let x = position.x + delta.dx;
    let y = position.y + delta.dy;

    while (x >= 0 && x < board.width && y >= 0 && y < board.height) {
      const hitPlayer = players.find(p =>
        !p.robot.isDestroyed &&
        p.id !== shooter.id &&
        p.robot.position.x === x &&
        p.robot.position.y === y
      );

      if (hitPlayer) {
        hitPlayer.robot.damage += 1;
        if (hitPlayer.robot.damage >= 10) {
          destroyRobot(hitPlayer);
        }
        break;
      }

      if (isWallBlocking(board, x, y, direction)) {
        break;
      }

      x += delta.dx;
      y += delta.dy;
    }
  }
}

function executeCheckpoints(state: GameState) {
  const { board, players } = state;

  for (const player of players) {
    if (player.robot.isDestroyed) continue;

    const { x, y } = player.robot.position;

    for (const checkpoint of board.checkpoints) {
      if (checkpoint.x === x && checkpoint.y === y) {
        // Must reach checkpoints in order
        if (checkpoint.order === player.robot.lastCheckpoint + 1) {
          player.robot.lastCheckpoint = checkpoint.order;
          player.robot.spawnPosition = { x, y }; // Update respawn point
        }
      }
    }

    // Repair on repair tiles
    const tile = board.tiles[y]?.[x];
    if (tile?.type === 'repair') {
      player.robot.damage = Math.max(0, player.robot.damage - 1);
    }
  }
}
