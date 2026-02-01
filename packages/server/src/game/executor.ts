import {
  GameState,
  Player,
  Card,
  Direction,
  rotateDirection,
  getDirectionDelta,
  MAX_ENERGY,
  isDamageCard,
  isHaywireCard,
  AnimationEvent,
  RobotMoveEvent,
  RobotRotateEvent,
  RobotPushedEvent,
  RobotDestroyedEvent,
  PlayerCardEvent,
  ConveyorMoveEvent,
  GearRotateEvent,
  LaserFireEvent,
  LaserHitEvent,
  CheckpointReachedEvent,
  EnergyGainedEvent,
  ANIMATION_DURATIONS,
} from '@circuit-chaos/shared';
import { shuffle } from './deck';

// Animation event collector context
interface AnimationContext {
  events: AnimationEvent[];
  currentTime: number;
}

interface Movement {
  player: Player;
  card: Card;
}

/**
 * Deal damage to a player by drawing from the damage deck
 * SPAM cards go to programming discard pile
 * Haywire cards go face-down under the current register
 */
export function dealDamageToPlayer(state: GameState, player: Player, count: number, currentRegister: number) {
  for (let i = 0; i < count; i++) {
    // If damage deck is empty, reshuffle discard pile
    if (state.damageDeck.length === 0) {
      if (state.damageDiscardPile.length === 0) {
        // No damage cards left at all
        return;
      }
      state.damageDeck = shuffle([...state.damageDiscardPile]);
      state.damageDiscardPile = [];
    }

    const damageCard = state.damageDeck.shift()!;

    if (damageCard.type === 'spam') {
      // SPAM goes into programming discard pile
      player.discardPile.push(damageCard);
    } else if (isHaywireCard(damageCard.type)) {
      // Haywire goes face-down under current register
      // If there's already a haywire in that register, discard the extra
      if (player.haywireRegisters[currentRegister] !== null) {
        state.damageDiscardPile.push(damageCard);
      } else {
        player.haywireRegisters[currentRegister] = damageCard;
      }
    }

    // Track damage count for display purposes
    player.robot.damage++;
  }
}

/**
 * Draw a card from the player's programming deck
 * If deck is empty, shuffle discard pile into deck
 */
function drawFromProgrammingDeck(player: Player): Card | null {
  if (player.deck.length === 0) {
    if (player.discardPile.length === 0) {
      return null;
    }
    player.deck = shuffle([...player.discardPile]);
    player.discardPile = [];
  }
  return player.deck.shift() ?? null;
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

/**
 * Execute a register and return animation events
 * The original executeRegister is kept for backwards compatibility
 */
export function executeRegister(state: GameState, registerIndex: number): void {
  executeRegisterWithEvents(state, registerIndex);
}

/**
 * Execute a register and return animation events for client-side animation
 */
export function executeRegisterWithEvents(state: GameState, registerIndex: number): AnimationEvent[] {
  const ctx: AnimationContext = {
    events: [],
    currentTime: 0,
  };

  // Register start event
  ctx.events.push({
    type: 'register_start',
    timestamp: ctx.currentTime,
    registerIndex,
  });

  // Get clockwise execution order starting from priority token holder
  const executionOrder = getExecutionOrder(state);

  // Collect all movements for this register
  const movements: Movement[] = [];

  for (const player of state.players) {
    // Check for haywire card first (takes precedence over regular programming)
    const haywireCard = player.haywireRegisters?.[registerIndex];
    const regularCard = player.registers[registerIndex];
    const card = haywireCard ?? regularCard;

    // Skip destroyed or powered down robots
    if (card && !player.robot.isDestroyed && !player.robot.isPoweredDown) {
      movements.push({ player, card });
    }
  }

  // Sort by player execution order (clockwise from priority holder)
  movements.sort((a, b) => {
    return executionOrder.indexOf(a.player.id) - executionOrder.indexOf(b.player.id);
  });

  // Execute each movement with animation events
  for (const { player, card } of movements) {
    // Add card display event
    ctx.events.push({
      type: 'player_card',
      timestamp: ctx.currentTime,
      playerId: player.id,
      playerName: player.name,
      playerColor: player.color,
      card,
    } as PlayerCardEvent);

    ctx.currentTime += ANIMATION_DURATIONS.CARD_DISPLAY;

    executeCardWithEvents(state, player, card, registerIndex, ctx);

    // Clear haywire register after execution
    if (player.haywireRegisters?.[registerIndex]) {
      player.haywireRegisters[registerIndex] = null;
    }

    ctx.currentTime += ANIMATION_DURATIONS.BETWEEN_PLAYERS;
  }

  // After all cards: execute board elements with events
  executeConveyorsWithEvents(state, ctx);
  executeGearsWithEvents(state, ctx);
  executeLasersWithEvents(state, registerIndex, ctx);
  executeCheckpointsWithEvents(state, ctx);
  executeBatteriesWithEvents(state, ctx);

  // Register end event
  ctx.events.push({
    type: 'register_end',
    timestamp: ctx.currentTime,
    registerIndex,
  });

  return ctx.events;
}

function executeCardWithEvents(state: GameState, player: Player, card: Card, registerIndex: number, ctx: AnimationContext) {
  const { robot } = player;

  switch (card.type) {
    case 'move1':
      moveRobotWithEvents(state, player, 1, ctx);
      break;
    case 'move2':
      moveRobotWithEvents(state, player, 2, ctx);
      break;
    case 'move3':
      moveRobotWithEvents(state, player, 3, ctx);
      break;
    case 'backup':
      moveRobotWithEvents(state, player, -1, ctx);
      break;
    case 'rotateLeft': {
      const fromDir = robot.direction;
      robot.direction = rotateDirection(robot.direction, 'ccw');
      ctx.events.push({
        type: 'robot_rotate',
        timestamp: ctx.currentTime,
        playerId: player.id,
        fromDirection: fromDir,
        toDirection: robot.direction,
        rotation: 'ccw',
      } as RobotRotateEvent);
      ctx.currentTime += ANIMATION_DURATIONS.ROBOT_ROTATION;
      break;
    }
    case 'rotateRight': {
      const fromDir = robot.direction;
      robot.direction = rotateDirection(robot.direction, 'cw');
      ctx.events.push({
        type: 'robot_rotate',
        timestamp: ctx.currentTime,
        playerId: player.id,
        fromDirection: fromDir,
        toDirection: robot.direction,
        rotation: 'cw',
      } as RobotRotateEvent);
      ctx.currentTime += ANIMATION_DURATIONS.ROBOT_ROTATION;
      break;
    }
    case 'uturn': {
      const fromDir = robot.direction;
      robot.direction = rotateDirection(robot.direction, 'uturn');
      ctx.events.push({
        type: 'robot_rotate',
        timestamp: ctx.currentTime,
        playerId: player.id,
        fromDirection: fromDir,
        toDirection: robot.direction,
        rotation: 'uturn',
      } as RobotRotateEvent);
      ctx.currentTime += ANIMATION_DURATIONS.ROBOT_ROTATION;
      break;
    }
    case 'powerUp':
      // Gain 1 energy (capped at MAX_ENERGY)
      player.robot.energy = Math.min((player.robot.energy ?? 0) + 1, MAX_ENERGY);
      ctx.events.push({
        type: 'energy_gained',
        timestamp: ctx.currentTime,
        playerId: player.id,
        amount: 1,
        source: 'power_up',
      } as EnergyGainedEvent);
      break;
    case 'again':
      // Repeat the previous register's card
      if (registerIndex > 0) {
        const previousCard = player.registers[registerIndex - 1];
        if (previousCard && previousCard.type !== 'again' && !isDamageCard(previousCard.type)) {
          executeCardWithEvents(state, player, previousCard, registerIndex, ctx);
        }
      }
      // In register 1, Again acts like SPAM (replaced by top of programming deck)
      if (registerIndex === 0) {
        const replacement = drawFromProgrammingDeck(player);
        if (replacement) {
          player.registers[registerIndex] = replacement;
          // Add player_card event for replacement card
          ctx.events.push({
            type: 'player_card',
            timestamp: ctx.currentTime,
            playerId: player.id,
            playerName: player.name,
            playerColor: player.color,
            card: replacement,
          } as PlayerCardEvent);
          ctx.currentTime += ANIMATION_DURATIONS.CARD_DISPLAY;
          executeCardWithEvents(state, player, replacement, registerIndex, ctx);
        }
      }
      break;

    // Damage cards
    case 'spam': {
      // SPAM: discard to damage discard pile, replace with top of programming deck
      state.damageDiscardPile.push(card);
      player.robot.damage = Math.max(0, player.robot.damage - 1); // Remove from damage count
      const replacement = drawFromProgrammingDeck(player);
      if (replacement) {
        player.registers[registerIndex] = replacement;
        // Add player_card event for replacement card
        ctx.events.push({
          type: 'player_card',
          timestamp: ctx.currentTime,
          playerId: player.id,
          playerName: player.name,
          playerColor: player.color,
          card: replacement,
        } as PlayerCardEvent);
        ctx.currentTime += ANIMATION_DURATIONS.CARD_DISPLAY;
        executeCardWithEvents(state, player, replacement, registerIndex, ctx);
      }
      break;
    }

    // Haywire cards
    case 'haywireMove1RotateMove1': {
      // Move 1, Rotate Right, Move 1
      state.damageDiscardPile.push(card);
      player.robot.damage = Math.max(0, player.robot.damage - 1);
      moveRobotWithEvents(state, player, 1, ctx);
      const fromDir = robot.direction;
      robot.direction = rotateDirection(robot.direction, 'cw');
      ctx.events.push({
        type: 'robot_rotate',
        timestamp: ctx.currentTime,
        playerId: player.id,
        fromDirection: fromDir,
        toDirection: robot.direction,
        rotation: 'cw',
      } as RobotRotateEvent);
      ctx.currentTime += ANIMATION_DURATIONS.ROBOT_ROTATION;
      moveRobotWithEvents(state, player, 1, ctx);
      break;
    }

    case 'haywireMove2Sideways': {
      // Move 2 spaces to the right (could be random left/right, but simplified)
      state.damageDiscardPile.push(card);
      player.robot.damage = Math.max(0, player.robot.damage - 1);
      // Move sideways right: temporarily rotate, move, rotate back
      const origDir = robot.direction;
      robot.direction = rotateDirection(robot.direction, 'cw');
      moveRobotWithEvents(state, player, 2, ctx);
      robot.direction = rotateDirection(robot.direction, 'ccw');
      // No rotation event as it's internal to the haywire card
      break;
    }

    case 'haywireMove3Uturn': {
      // Move 3, then U-Turn
      state.damageDiscardPile.push(card);
      player.robot.damage = Math.max(0, player.robot.damage - 1);
      moveRobotWithEvents(state, player, 3, ctx);
      const fromDir = robot.direction;
      robot.direction = rotateDirection(robot.direction, 'uturn');
      ctx.events.push({
        type: 'robot_rotate',
        timestamp: ctx.currentTime,
        playerId: player.id,
        fromDirection: fromDir,
        toDirection: robot.direction,
        rotation: 'uturn',
      } as RobotRotateEvent);
      ctx.currentTime += ANIMATION_DURATIONS.ROBOT_ROTATION;
      break;
    }
  }
}

function moveRobotWithEvents(state: GameState, player: Player, steps: number, ctx: AnimationContext) {
  const { robot } = player;
  const { board } = state;

  const direction = steps < 0
    ? rotateDirection(robot.direction, 'uturn')
    : robot.direction;
  const delta = getDirectionDelta(direction);
  const absSteps = Math.abs(steps);

  for (let i = 0; i < absSteps; i++) {
    const fromX = robot.position.x;
    const fromY = robot.position.y;
    const newX = robot.position.x + delta.dx;
    const newY = robot.position.y + delta.dy;

    // Check wall collision
    if (isWallBlocking(board, robot.position.x, robot.position.y, direction)) {
      break;
    }

    // Check bounds
    if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
      // Fell off the board
      ctx.events.push({
        type: 'robot_destroyed',
        timestamp: ctx.currentTime,
        playerId: player.id,
        reason: 'off_board',
        x: fromX,
        y: fromY,
      } as RobotDestroyedEvent);
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
      if (!pushRobotWithEvents(state, blockingPlayer, direction, player.id, ctx)) {
        break; // Can't push, stop movement
      }
    }

    // Move robot
    robot.position.x = newX;
    robot.position.y = newY;

    // Add move event
    ctx.events.push({
      type: 'robot_move',
      timestamp: ctx.currentTime,
      playerId: player.id,
      fromX,
      fromY,
      toX: newX,
      toY: newY,
      direction,
    } as RobotMoveEvent);
    ctx.currentTime += ANIMATION_DURATIONS.ROBOT_MOVE_PER_TILE;

    // Check for pit
    const tile = board.tiles[newY]?.[newX];
    if (tile?.type === 'pit') {
      ctx.events.push({
        type: 'robot_destroyed',
        timestamp: ctx.currentTime,
        playerId: player.id,
        reason: 'pit',
        x: newX,
        y: newY,
      } as RobotDestroyedEvent);
      destroyRobot(player);
      break;
    }
  }
}

function pushRobotWithEvents(state: GameState, player: Player, direction: Direction, pushedByPlayerId: string, ctx: AnimationContext): boolean {
  const { robot } = player;
  const { board } = state;
  const delta = getDirectionDelta(direction);

  const fromX = robot.position.x;
  const fromY = robot.position.y;
  const newX = robot.position.x + delta.dx;
  const newY = robot.position.y + delta.dy;

  // Check wall
  if (isWallBlocking(board, robot.position.x, robot.position.y, direction)) {
    return false;
  }

  // Check bounds
  if (newX < 0 || newX >= board.width || newY < 0 || newY >= board.height) {
    ctx.events.push({
      type: 'robot_pushed',
      timestamp: ctx.currentTime,
      playerId: player.id,
      pushedByPlayerId,
      fromX,
      fromY,
      toX: newX,
      toY: newY,
      direction,
    } as RobotPushedEvent);
    ctx.events.push({
      type: 'robot_destroyed',
      timestamp: ctx.currentTime,
      playerId: player.id,
      reason: 'off_board',
      x: fromX,
      y: fromY,
    } as RobotDestroyedEvent);
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
    if (!pushRobotWithEvents(state, nextBlockingPlayer, direction, pushedByPlayerId, ctx)) {
      return false;
    }
  }

  robot.position.x = newX;
  robot.position.y = newY;

  // Add pushed event
  ctx.events.push({
    type: 'robot_pushed',
    timestamp: ctx.currentTime,
    playerId: player.id,
    pushedByPlayerId,
    fromX,
    fromY,
    toX: newX,
    toY: newY,
    direction,
  } as RobotPushedEvent);

  // Check pit
  const tile = board.tiles[newY]?.[newX];
  if (tile?.type === 'pit') {
    ctx.events.push({
      type: 'robot_destroyed',
      timestamp: ctx.currentTime,
      playerId: player.id,
      reason: 'pit',
      x: newX,
      y: newY,
    } as RobotDestroyedEvent);
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
      // Determine respawn position: reboot token or spawn position
      let respawnPos = { ...player.robot.spawnPosition };
      let pushDirection: Direction | undefined;

      // Use reboot token if available
      if (state.board.rebootToken) {
        respawnPos = { x: state.board.rebootToken.x, y: state.board.rebootToken.y };
        pushDirection = state.board.rebootToken.pushDirection;
      }

      // Clear all cards from hand (2023 rules)
      // SPAM stays in player's discard pile, Haywire goes to damage discard
      for (const card of player.hand) {
        if (card.type === 'spam') {
          player.discardPile.push(card);
        } else if (isHaywireCard(card.type)) {
          state.damageDiscardPile.push(card);
        }
      }
      player.hand = player.hand.filter(card => !isDamageCard(card.type));

      // Clear and discard registers
      for (let i = 0; i < player.registers.length; i++) {
        const card = player.registers[i];
        if (card) {
          if (isDamageCard(card.type)) {
            if (card.type === 'spam') {
              player.discardPile.push(card);
            } else {
              state.damageDiscardPile.push(card);
            }
          } else {
            player.discardPile.push(card);
          }
        }
        player.registers[i] = null;
      }

      // Clear haywire registers to damage discard
      for (let i = 0; i < player.haywireRegisters.length; i++) {
        const haywire = player.haywireRegisters[i];
        if (haywire) {
          state.damageDiscardPile.push(haywire);
          player.haywireRegisters[i] = null;
        }
      }

      // Reset damage counter
      player.robot.damage = 0;

      // Check if respawn position is occupied and push if needed
      if (pushDirection) {
        const occupyingPlayer = state.players.find(p =>
          !p.robot.isDestroyed &&
          p.id !== player.id &&
          p.robot.position.x === respawnPos.x &&
          p.robot.position.y === respawnPos.y
        );
        if (occupyingPlayer) {
          pushRobotOneSpace(state, occupyingPlayer, pushDirection);
        }
      }

      player.robot.position = { ...respawnPos };
      player.robot.isDestroyed = false;

      // Draw 2 damage cards on reboot (2023 rules)
      dealDamageToPlayer(state, player, 2, 0);
    }
  }
}

/**
 * Push a robot one space in a direction (for reboot collision)
 */
function pushRobotOneSpace(state: GameState, player: Player, direction: Direction) {
  const delta = getDirectionDelta(direction);
  const newX = player.robot.position.x + delta.dx;
  const newY = player.robot.position.y + delta.dy;

  // Check bounds
  if (newX >= 0 && newX < state.board.width && newY >= 0 && newY < state.board.height) {
    player.robot.position.x = newX;
    player.robot.position.y = newY;

    // Check if pushed into pit
    const tile = state.board.tiles[newY]?.[newX];
    if (tile?.type === 'pit') {
      destroyRobot(player);
    }
  } else {
    // Pushed off the board
    destroyRobot(player);
  }
}

export function processPowerDown(state: GameState) {
  for (const player of state.players) {
    if (player.robot.isDestroyed) continue;

    // Clear shutdown state at end of round
    if (player.robot.isPoweredDown) {
      player.robot.isPoweredDown = false;
    }

    // Apply announced shutdown for next round
    if (player.robot.willPowerDown) {
      player.robot.isPoweredDown = true;
      player.robot.willPowerDown = false;
    }
  }
}

/**
 * Perform voluntary shutdown for a player (2023 rules)
 * - Discards all damage cards (SPAM and Haywire) to damage discard pile
 * - Discards all programming cards to player's discard pile
 * - Robot stays on board but doesn't execute programming
 * - Robot is still affected by board elements, pushing, and lasers
 * - Robot cannot collect energy or checkpoints while shut down
 */
export function performShutdown(state: GameState, player: Player) {
  player.robot.isPoweredDown = true;
  player.robot.damage = 0;

  // Discard all damage cards from hand (SPAM cards) to damage discard pile
  const damageCardsInHand = player.hand.filter(card => isDamageCard(card.type));
  for (const card of damageCardsInHand) {
    state.damageDiscardPile.push(card);
  }
  player.hand = player.hand.filter(card => !isDamageCard(card.type));

  // Discard all damage cards from discard pile
  const damageCardsInDiscard = player.discardPile.filter(card => isDamageCard(card.type));
  for (const card of damageCardsInDiscard) {
    state.damageDiscardPile.push(card);
  }
  player.discardPile = player.discardPile.filter(card => !isDamageCard(card.type));

  // Move haywire cards to damage discard pile
  for (let i = 0; i < player.haywireRegisters.length; i++) {
    const haywire = player.haywireRegisters[i];
    if (haywire) {
      state.damageDiscardPile.push(haywire);
      player.haywireRegisters[i] = null;
    }
  }

  // Discard programming cards from registers to player's discard pile
  for (let i = 0; i < player.registers.length; i++) {
    const card = player.registers[i];
    if (card && !isDamageCard(card.type)) {
      player.discardPile.push(card);
    }
    player.registers[i] = null;
  }
}

function executeConveyorsWithEvents(state: GameState, ctx: AnimationContext) {
  const { board, players } = state;

  const expressMovements: ConveyorMoveEvent['movements'] = [];
  const regularMovements: ConveyorMoveEvent['movements'] = [];

  // First pass: express conveyors (speed 2)
  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'conveyor' && tile.speed === 2) {
      const fromX = player.robot.position.x;
      const fromY = player.robot.position.y;
      const moved = moveByConveyorWithTracking(state, player, tile.direction);
      if (moved) {
        expressMovements.push({
          playerId: player.id,
          fromX,
          fromY,
          toX: player.robot.position.x,
          toY: player.robot.position.y,
          direction: tile.direction,
        });
      }
    }
  }

  if (expressMovements.length > 0) {
    ctx.events.push({
      type: 'conveyor_move',
      timestamp: ctx.currentTime,
      movements: expressMovements,
    } as ConveyorMoveEvent);
    ctx.currentTime += ANIMATION_DURATIONS.CONVEYOR_MOVE;
  }

  // Second pass: all conveyors
  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'conveyor') {
      const fromX = player.robot.position.x;
      const fromY = player.robot.position.y;
      const moved = moveByConveyorWithTracking(state, player, tile.direction);
      if (moved) {
        regularMovements.push({
          playerId: player.id,
          fromX,
          fromY,
          toX: player.robot.position.x,
          toY: player.robot.position.y,
          direction: tile.direction,
          rotation: tile.turnDirection,
        });
      }

      // Check for rotation on corner conveyors
      if (tile.turnDirection) {
        player.robot.direction = rotateDirection(player.robot.direction, tile.turnDirection);
      }
    }
  }

  if (regularMovements.length > 0) {
    ctx.events.push({
      type: 'conveyor_move',
      timestamp: ctx.currentTime,
      movements: regularMovements,
    } as ConveyorMoveEvent);
    ctx.currentTime += ANIMATION_DURATIONS.CONVEYOR_MOVE;
  }
}

function moveByConveyorWithTracking(state: GameState, player: Player, direction: Direction): boolean {
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
    return true;
  }
  return false;
}

function executeGearsWithEvents(state: GameState, ctx: AnimationContext) {
  const { board, players } = state;

  const rotations: GearRotateEvent['rotations'] = [];

  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'gear') {
      const fromDirection = player.robot.direction;
      player.robot.direction = rotateDirection(player.robot.direction, tile.rotation);
      rotations.push({
        playerId: player.id,
        rotation: tile.rotation,
        fromDirection,
        toDirection: player.robot.direction,
      });
    }
  }

  if (rotations.length > 0) {
    ctx.events.push({
      type: 'gear_rotate',
      timestamp: ctx.currentTime,
      rotations,
    } as GearRotateEvent);
    ctx.currentTime += ANIMATION_DURATIONS.GEAR_ROTATION;
  }
}

function executeLasersWithEvents(state: GameState, registerIndex: number, ctx: AnimationContext) {
  const { board, players } = state;

  const lasersFired: LaserFireEvent['lasers'] = [];
  const laserHits: Array<{ playerId: string; damage: number; x: number; y: number }> = [];

  // Board lasers
  for (const laser of board.lasers) {
    const delta = getDirectionDelta(laser.direction);
    let x = laser.x;
    let y = laser.y;
    let endX = laser.x;
    let endY = laser.y;

    while (x >= 0 && x < board.width && y >= 0 && y < board.height) {
      const hitPlayer = players.find(p =>
        !p.robot.isDestroyed &&
        p.robot.position.x === x &&
        p.robot.position.y === y
      );

      if (hitPlayer) {
        endX = x;
        endY = y;
        // Deal damage cards from damage deck
        dealDamageToPlayer(state, hitPlayer, laser.strength, registerIndex);
        laserHits.push({
          playerId: hitPlayer.id,
          damage: laser.strength,
          x,
          y,
        });
        if (hitPlayer.robot.damage >= 10) {
          destroyRobot(hitPlayer);
        }
        break;
      }

      // Check for wall blocking
      if (isWallBlocking(board, x, y, laser.direction)) {
        endX = x;
        endY = y;
        break;
      }

      endX = x;
      endY = y;
      x += delta.dx;
      y += delta.dy;
    }

    lasersFired.push({
      sourceType: 'board',
      startX: laser.x,
      startY: laser.y,
      endX,
      endY,
      direction: laser.direction,
      strength: laser.strength,
    });
  }

  // Robot lasers
  for (const shooter of players) {
    if (shooter.robot.isDestroyed) continue;

    const { direction, position } = shooter.robot;
    const delta = getDirectionDelta(direction);
    let x = position.x + delta.dx;
    let y = position.y + delta.dy;
    let endX = position.x;
    let endY = position.y;

    while (x >= 0 && x < board.width && y >= 0 && y < board.height) {
      const hitPlayer = players.find(p =>
        !p.robot.isDestroyed &&
        p.id !== shooter.id &&
        p.robot.position.x === x &&
        p.robot.position.y === y
      );

      if (hitPlayer) {
        endX = x;
        endY = y;
        // Deal 1 damage card from damage deck
        dealDamageToPlayer(state, hitPlayer, 1, registerIndex);
        laserHits.push({
          playerId: hitPlayer.id,
          damage: 1,
          x,
          y,
        });
        if (hitPlayer.robot.damage >= 10) {
          destroyRobot(hitPlayer);
        }
        break;
      }

      if (isWallBlocking(board, x, y, direction)) {
        endX = x;
        endY = y;
        break;
      }

      endX = x;
      endY = y;
      x += delta.dx;
      y += delta.dy;
    }

    lasersFired.push({
      sourceType: 'robot',
      sourcePlayerId: shooter.id,
      startX: position.x,
      startY: position.y,
      endX,
      endY,
      direction,
      strength: 1,
    });
  }

  if (lasersFired.length > 0) {
    ctx.events.push({
      type: 'laser_fire',
      timestamp: ctx.currentTime,
      lasers: lasersFired,
    } as LaserFireEvent);
  }

  for (const hit of laserHits) {
    ctx.events.push({
      type: 'laser_hit',
      timestamp: ctx.currentTime,
      playerId: hit.playerId,
      damage: hit.damage,
      x: hit.x,
      y: hit.y,
    } as LaserHitEvent);
  }

  if (lasersFired.length > 0) {
    ctx.currentTime += ANIMATION_DURATIONS.LASER_FIRE;
  }
}

function executeCheckpointsWithEvents(state: GameState, ctx: AnimationContext) {
  const { board, players } = state;

  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    // Shutdown robots cannot reach checkpoints (2023 rules)
    if (player.robot.isPoweredDown) continue;

    const { x, y } = player.robot.position;

    for (const checkpoint of board.checkpoints) {
      if (checkpoint.x === x && checkpoint.y === y) {
        // Must reach checkpoints in order
        if (checkpoint.order === player.robot.lastCheckpoint + 1) {
          player.robot.lastCheckpoint = checkpoint.order;
          player.robot.spawnPosition = { x, y }; // Update respawn point
          ctx.events.push({
            type: 'checkpoint_reached',
            timestamp: ctx.currentTime,
            playerId: player.id,
            checkpointNumber: checkpoint.order,
            x,
            y,
          } as CheckpointReachedEvent);
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

function executeBatteriesWithEvents(state: GameState, ctx: AnimationContext) {
  const { board, players } = state;

  for (const player of players) {
    if (player.robot.isDestroyed) continue;
    // Shutdown robots cannot collect energy (2023 rules)
    if (player.robot.isPoweredDown) continue;

    const { x, y } = player.robot.position;
    const tile = board.tiles[y]?.[x];

    if (tile?.type === 'battery') {
      // Grant 1 energy (capped at MAX_ENERGY)
      const oldEnergy = player.robot.energy ?? 0;
      player.robot.energy = Math.min(oldEnergy + 1, MAX_ENERGY);
      if (player.robot.energy > oldEnergy) {
        ctx.events.push({
          type: 'energy_gained',
          timestamp: ctx.currentTime,
          playerId: player.id,
          amount: 1,
          source: 'battery',
        } as EnergyGainedEvent);
      }
    }
  }
}
