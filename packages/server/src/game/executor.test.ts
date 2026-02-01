import { describe, it, expect, beforeEach } from 'vitest';
import { executeRegister, executeRegisterWithEvents, respawnDestroyedRobots, performShutdown } from './executor';
import {
  GameState,
  Player,
  Board,
  Card,
  AnimationEvent,
  PlayerCardEvent,
  createEmptyBoard,
  createRobot,
  createPlayer,
} from '@circuit-chaos/shared';

/** Creates a minimal game state for testing. */
function createTestGameState(boardWidth = 5, boardHeight = 5): GameState {
  const board = createEmptyBoard(boardWidth, boardHeight, 'Test');
  board.spawnPoints = [{ x: 2, y: 2, order: 1 }];

  return {
    id: 'test-game',
    phase: 'executing',
    board,
    players: [],
    currentRegister: 0,
    turn: 1,
    hostId: 'host',
    maxPlayers: 4,
    createdAt: Date.now(),
    theme: 'industrial',
    cardPreviewEnabled: true,
    priorityPlayerId: 'host',
    damageDeck: [],
    damageDiscardPile: [],
  };
}

/** Creates a test player with robot at given position. */
function createTestPlayer(
  id: string,
  x: number,
  y: number,
  direction: 'north' | 'east' | 'south' | 'west' = 'north'
): Player {
  const playerData = createPlayer(id, `Player ${id}`, 0);
  const robot = createRobot(id, { x, y });
  robot.direction = direction;
  return { ...playerData, robot };
}

/** Creates a test card. */
function createTestCard(
  type: Card['type'],
  priority: number = 500
): Card {
  return { id: `card-${type}`, type, priority };
}

describe('executeRegister - movement', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState();
  });

  it('moves robot forward with move1', () => {
    const player = createTestPlayer('p1', 2, 2, 'north');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.position).toEqual({ x: 2, y: 1 });
  });

  it('moves robot forward with move2', () => {
    const player = createTestPlayer('p1', 2, 3, 'north');
    player.registers = [createTestCard('move2'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.position).toEqual({ x: 2, y: 1 });
  });

  it('moves robot backward with backup', () => {
    const player = createTestPlayer('p1', 2, 2, 'north');
    player.registers = [createTestCard('backup'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.position).toEqual({ x: 2, y: 3 });
  });

  it('respects board boundaries', () => {
    const player = createTestPlayer('p1', 0, 0, 'north');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    // Robot should be destroyed (fell off board)
    expect(player.robot.lives).toBeLessThan(3);
  });
});

describe('executeRegister - rotation', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState();
  });

  it('rotates left correctly', () => {
    const player = createTestPlayer('p1', 2, 2, 'north');
    player.registers = [createTestCard('rotateLeft'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.direction).toBe('west');
  });

  it('rotates right correctly', () => {
    const player = createTestPlayer('p1', 2, 2, 'north');
    player.registers = [createTestCard('rotateRight'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.direction).toBe('east');
  });

  it('performs u-turn correctly', () => {
    const player = createTestPlayer('p1', 2, 2, 'north');
    player.registers = [createTestCard('uturn'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.direction).toBe('south');
  });
});

describe('executeRegister - priority token (2023 rules)', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('executes in clockwise order starting from priority token holder', () => {
    // Two robots facing same direction, one behind the other
    const player1 = createTestPlayer('p1', 5, 6, 'north'); // behind
    const player2 = createTestPlayer('p2', 5, 5, 'north'); // in front

    player1.registers = [createTestCard('move1', 100), null, null, null, null];
    player2.registers = [createTestCard('move1', 800), null, null, null, null];

    state.players = [player1, player2];
    // Player 1 has the priority token, so moves first
    state.priorityPlayerId = 'p1';
    executeRegister(state, 0);

    // Player 1 moves first (has priority token), tries to move to (5,5) but player2 is there
    // So player 1 pushes player 2 to (5,4) and moves to (5,5)
    // Then player 2 moves from (5,4) north to (5,3)
    expect(player1.robot.position).toEqual({ x: 5, y: 5 });
    expect(player2.robot.position).toEqual({ x: 5, y: 3 });
  });

  it('respects clockwise order from priority holder', () => {
    const player1 = createTestPlayer('p1', 2, 2, 'east');
    const player2 = createTestPlayer('p2', 4, 2, 'west');

    player1.registers = [createTestCard('move1', 100), null, null, null, null];
    player2.registers = [createTestCard('move1', 800), null, null, null, null];

    state.players = [player1, player2];
    // Player 2 has priority, so moves first
    state.priorityPlayerId = 'p2';
    executeRegister(state, 0);

    // Player 2 moves first (priority token), from (4,2) west to (3,2)
    // Player 1 moves second, from (2,2) east to (3,2) - but p2 is there
    // So player 1 pushes p2 east to (4,2), player 1 moves to (3,2)
    expect(player1.robot.position).toEqual({ x: 3, y: 2 });
    expect(player2.robot.position).toEqual({ x: 4, y: 2 });
  });
});

describe('executeRegister - pushing', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('pushes another robot when moving into its space', () => {
    const player1 = createTestPlayer('p1', 3, 5, 'east');
    const player2 = createTestPlayer('p2', 4, 5, 'north');

    player1.registers = [createTestCard('move1', 500), null, null, null, null];
    player2.registers = [null, null, null, null, null];

    state.players = [player1, player2];
    executeRegister(state, 0);

    expect(player1.robot.position).toEqual({ x: 4, y: 5 });
    expect(player2.robot.position).toEqual({ x: 5, y: 5 });
  });
});

describe('executeRegister - pits', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
    state.board.tiles[5][5] = { type: 'pit' };
  });

  it('destroys robot that moves into pit', () => {
    const player = createTestPlayer('p1', 4, 5, 'east');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.lives).toBe(2); // Lost a life
  });
});

describe('executeRegister - walls', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
    state.board.walls = [{ x: 5, y: 5, side: 'north' }];
  });

  it('blocks movement through walls', () => {
    const player = createTestPlayer('p1', 5, 5, 'north');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    // Robot should not have moved
    expect(player.robot.position).toEqual({ x: 5, y: 5 });
  });
});

describe('executeRegister - gears', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('rotates robot on clockwise gear', () => {
    state.board.tiles[5][5] = { type: 'gear', rotation: 'cw' };
    const player = createTestPlayer('p1', 5, 5, 'north');
    player.registers = [null, null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.direction).toBe('east');
  });

  it('rotates robot on counter-clockwise gear', () => {
    state.board.tiles[5][5] = { type: 'gear', rotation: 'ccw' };
    const player = createTestPlayer('p1', 5, 5, 'north');
    player.registers = [null, null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.direction).toBe('west');
  });
});

describe('executeRegister - checkpoints', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
    state.board.checkpoints = [
      { x: 5, y: 5, order: 1 },
      { x: 7, y: 5, order: 2 },
    ];
  });

  it('registers checkpoint when robot lands on it', () => {
    const player = createTestPlayer('p1', 4, 5, 'east');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    expect(player.robot.lastCheckpoint).toBe(1);
  });

  it('requires checkpoints in order', () => {
    const player = createTestPlayer('p1', 6, 5, 'east');
    player.robot.lastCheckpoint = 0;
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    // Should not register checkpoint 2 without checkpoint 1
    expect(player.robot.lastCheckpoint).toBe(0);
  });
});

describe('executeRegister - destroyed robots', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('destroyed robot stays destroyed for the rest of the round', () => {
    const player = createTestPlayer('p1', 0, 0, 'north');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    // Robot will fall off the board
    executeRegister(state, 0);

    // Robot should be destroyed (not respawned yet)
    expect(player.robot.isDestroyed).toBe(true);
    expect(player.robot.lives).toBe(2); // Lost one life
  });

  it('destroyed robot does not execute cards', () => {
    const player = createTestPlayer('p1', 5, 5, 'north');
    player.robot.isDestroyed = true;
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    const initialPos = { ...player.robot.position };
    executeRegister(state, 0);

    // Robot should not have moved
    expect(player.robot.position).toEqual(initialPos);
  });
});

describe('respawnDestroyedRobots', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('respawns destroyed robots with lives remaining', () => {
    const player = createTestPlayer('p1', 5, 5, 'east');
    player.robot.isDestroyed = true;
    player.robot.lives = 2;
    player.robot.spawnPosition = { x: 2, y: 2 };
    state.players = [player];
    // Add SPAM cards to damage deck for reboot damage
    state.damageDeck = [
      { id: 'spam1', type: 'spam', priority: 0 },
      { id: 'spam2', type: 'spam', priority: 0 },
    ];

    respawnDestroyedRobots(state);

    expect(player.robot.isDestroyed).toBe(false);
    expect(player.robot.position).toEqual({ x: 2, y: 2 });
    expect(player.robot.damage).toBe(2); // Respawns with 2 damage (from reboot)
    expect(player.discardPile).toHaveLength(2); // SPAM cards go to discard
  });

  it('clears registers on respawn', () => {
    const player = createTestPlayer('p1', 5, 5, 'east');
    player.robot.isDestroyed = true;
    player.robot.lives = 2;
    player.registers = [
      createTestCard('move1'),
      createTestCard('move2'),
      null,
      null,
      null,
    ];
    state.players = [player];

    respawnDestroyedRobots(state);

    expect(player.registers).toEqual([null, null, null, null, null]);
  });

  it('does not respawn robots with no lives', () => {
    const player = createTestPlayer('p1', 5, 5, 'east');
    player.robot.isDestroyed = true;
    player.robot.lives = 0;
    state.players = [player];

    respawnDestroyedRobots(state);

    expect(player.robot.isDestroyed).toBe(true);
  });

  it('does not affect non-destroyed robots', () => {
    const player = createTestPlayer('p1', 5, 5, 'east');
    player.robot.isDestroyed = false;
    player.robot.damage = 5;
    state.players = [player];

    respawnDestroyedRobots(state);

    // Should not have changed
    expect(player.robot.damage).toBe(5);
    expect(player.robot.position).toEqual({ x: 5, y: 5 });
  });
});

describe('executeRegister - batteries', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('grants 1 energy when robot ends on battery tile', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    player.robot.energy = 3;
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    // Place battery at target position (3, 2)
    state.board.tiles[2][3] = { type: 'battery' };

    executeRegister(state, 0);

    expect(player.robot.position).toEqual({ x: 3, y: 2 });
    expect(player.robot.energy).toBe(4);
  });

  it('caps energy at MAX_ENERGY (10)', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    player.robot.energy = 10;
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    // Place battery at target position
    state.board.tiles[2][3] = { type: 'battery' };

    executeRegister(state, 0);

    expect(player.robot.energy).toBe(10); // Still capped at 10
  });

  it('does not grant energy to destroyed robots', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    player.robot.energy = 3;
    player.robot.isDestroyed = true;
    player.registers = [null, null, null, null, null];
    state.players = [player];

    // Place battery at robot position
    state.board.tiles[3][3] = { type: 'battery' };

    executeRegister(state, 0);

    expect(player.robot.energy).toBe(3); // Unchanged
  });
});

describe('executeRegister - damage cards', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('SPAM card is discarded and replaced with programming card', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    const spamCard: Card = { id: 'spam1', type: 'spam', priority: 0 };
    const replacementCard: Card = { id: 'move1', type: 'move1', priority: 0 };
    player.registers = [spamCard, null, null, null, null];
    player.deck = [replacementCard];
    player.robot.damage = 1; // Has 1 damage (the SPAM)
    state.players = [player];

    executeRegister(state, 0);

    // SPAM should be discarded to damage discard pile
    expect(state.damageDiscardPile).toContainEqual(spamCard);
    // Register should have the replacement card
    expect(player.registers[0]).toEqual(replacementCard);
    // Robot should have moved (move1 was executed)
    expect(player.robot.position).toEqual({ x: 3, y: 2 });
    // Damage count should be reduced
    expect(player.robot.damage).toBe(0);
  });

  it('Haywire Move1-Rotate-Move1 executes correctly', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    const haywireCard: Card = { id: 'hw1', type: 'haywireMove1RotateMove1', priority: 0 };
    player.registers = [haywireCard, null, null, null, null];
    player.robot.damage = 1;
    state.players = [player];

    executeRegister(state, 0);

    // Move 1 north (3,2), rotate right (east), move 1 east (4,2)
    expect(player.robot.position).toEqual({ x: 4, y: 2 });
    expect(player.robot.direction).toBe('east');
    // Haywire discarded
    expect(state.damageDiscardPile).toContainEqual(haywireCard);
    expect(player.robot.damage).toBe(0);
  });

  it('Haywire Move3-Uturn executes correctly', () => {
    const player = createTestPlayer('p1', 3, 5, 'north');
    const haywireCard: Card = { id: 'hw1', type: 'haywireMove3Uturn', priority: 0 };
    player.registers = [haywireCard, null, null, null, null];
    player.robot.damage = 1;
    state.players = [player];

    executeRegister(state, 0);

    // Move 3 north (3,2), then U-turn (south)
    expect(player.robot.position).toEqual({ x: 3, y: 2 });
    expect(player.robot.direction).toBe('south');
  });

  it('face-down Haywire under register takes precedence', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    const regularCard: Card = { id: 'move1', type: 'move1', priority: 0 };
    const haywireCard: Card = { id: 'hw1', type: 'haywireMove3Uturn', priority: 0 };
    player.registers = [regularCard, null, null, null, null];
    player.haywireRegisters = [haywireCard, null, null, null, null]; // Haywire from previous round
    player.robot.damage = 1;
    state.players = [player];

    executeRegister(state, 0);

    // Haywire should execute instead of regular card
    // Move 3 north would go off board at (3,0), so robot is destroyed or stops
    // Actually let's check - starting at (3,3), move 3 north = (3,0)
    expect(player.robot.direction).toBe('south'); // U-turn happened
    // Haywire register should be cleared
    expect(player.haywireRegisters[0]).toBeNull();
  });
});

describe('performShutdown', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState();
  });

  it('sets robot to powered down state', () => {
    const player = createTestPlayer('p1', 2, 2);
    state.players = [player];

    performShutdown(state, player);

    expect(player.robot.isPoweredDown).toBe(true);
  });

  it('clears damage counter', () => {
    const player = createTestPlayer('p1', 2, 2);
    player.robot.damage = 5;
    state.players = [player];

    performShutdown(state, player);

    expect(player.robot.damage).toBe(0);
  });

  it('moves SPAM cards from hand to damage discard pile', () => {
    const player = createTestPlayer('p1', 2, 2);
    const spamCard: Card = { id: 'spam1', type: 'spam', priority: 0 };
    const regularCard: Card = { id: 'move1', type: 'move1', priority: 500 };
    player.hand = [spamCard, regularCard];
    state.players = [player];

    performShutdown(state, player);

    expect(player.hand).toHaveLength(1);
    expect(player.hand[0].type).toBe('move1');
    expect(state.damageDiscardPile).toContain(spamCard);
  });

  it('moves Haywire cards from haywireRegisters to damage discard pile', () => {
    const player = createTestPlayer('p1', 2, 2);
    const haywireCard: Card = { id: 'hw1', type: 'haywireMove1RotateMove1', priority: 0 };
    player.haywireRegisters = [haywireCard, null, null, null, null];
    state.players = [player];

    performShutdown(state, player);

    expect(player.haywireRegisters[0]).toBeNull();
    expect(state.damageDiscardPile).toContain(haywireCard);
  });

  it('moves programming cards from registers to player discard pile', () => {
    const player = createTestPlayer('p1', 2, 2);
    const card1: Card = { id: 'move1', type: 'move1', priority: 500 };
    const card2: Card = { id: 'rotL', type: 'rotateLeft', priority: 200 };
    player.registers = [card1, card2, null, null, null];
    state.players = [player];

    performShutdown(state, player);

    expect(player.registers).toEqual([null, null, null, null, null]);
    expect(player.discardPile).toContain(card1);
    expect(player.discardPile).toContain(card2);
  });

  it('moves damage cards from discard pile to damage discard pile', () => {
    const player = createTestPlayer('p1', 2, 2);
    const spamCard: Card = { id: 'spam1', type: 'spam', priority: 0 };
    const regularCard: Card = { id: 'move1', type: 'move1', priority: 500 };
    player.discardPile = [spamCard, regularCard];
    state.players = [player];

    performShutdown(state, player);

    expect(player.discardPile).toHaveLength(1);
    expect(player.discardPile[0].type).toBe('move1');
    expect(state.damageDiscardPile).toContain(spamCard);
  });
});

describe('shutdown robot behavior', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState();
  });

  it('shutdown robot does not execute cards', () => {
    const player = createTestPlayer('p1', 2, 2);
    player.robot.isPoweredDown = true;
    player.registers = [{ id: 'move1', type: 'move1', priority: 500 }, null, null, null, null];
    state.players = [player];

    executeRegister(state, 0);

    // Robot should not have moved
    expect(player.robot.position).toEqual({ x: 2, y: 2 });
  });

  it('shutdown robot does not collect checkpoint', () => {
    const player = createTestPlayer('p1', 3, 3);
    player.robot.isPoweredDown = true;
    player.robot.lastCheckpoint = 0;
    state.board.checkpoints = [{ x: 3, y: 3, order: 1 }];
    state.players = [player];

    executeRegister(state, 0);

    // Should not have registered checkpoint
    expect(player.robot.lastCheckpoint).toBe(0);
  });

  it('shutdown robot does not collect battery energy', () => {
    const player = createTestPlayer('p1', 3, 3);
    player.robot.isPoweredDown = true;
    player.robot.energy = 3;
    state.board.tiles[3][3] = { type: 'battery' };
    state.players = [player];

    executeRegister(state, 0);

    // Energy should not have increased
    expect(player.robot.energy).toBe(3);
  });
});

describe('reboot with rebootToken', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState();
  });

  it('respawns at reboot token position', () => {
    state.board.rebootToken = { x: 1, y: 1, pushDirection: 'east' };
    const player = createTestPlayer('p1', 4, 4);
    player.robot.isDestroyed = true;
    player.robot.lives = 2;
    state.players = [player];
    // Add SPAM cards to damage deck so reboot damage can be dealt
    state.damageDeck = [
      { id: 'spam1', type: 'spam', priority: 0 },
      { id: 'spam2', type: 'spam', priority: 0 },
    ];

    respawnDestroyedRobots(state);

    expect(player.robot.position).toEqual({ x: 1, y: 1 });
    expect(player.robot.isDestroyed).toBe(false);
  });

  it('pushes robot on reboot token when occupied', () => {
    state.board.rebootToken = { x: 2, y: 2, pushDirection: 'east' };
    const player1 = createTestPlayer('p1', 4, 4);
    player1.robot.isDestroyed = true;
    player1.robot.lives = 2;
    const player2 = createTestPlayer('p2', 2, 2); // Occupying reboot token
    state.players = [player1, player2];
    state.damageDeck = [
      { id: 'spam1', type: 'spam', priority: 0 },
      { id: 'spam2', type: 'spam', priority: 0 },
    ];

    respawnDestroyedRobots(state);

    // Player 2 should have been pushed east
    expect(player2.robot.position).toEqual({ x: 3, y: 2 });
    // Player 1 should respawn at reboot token
    expect(player1.robot.position).toEqual({ x: 2, y: 2 });
  });

  it('clears hand and moves SPAM to discard, Haywire to damage discard', () => {
    state.board.rebootToken = { x: 1, y: 1, pushDirection: 'east' };
    const player = createTestPlayer('p1', 4, 4);
    player.robot.isDestroyed = true;
    player.robot.lives = 2;
    const spamCard: Card = { id: 'spam1', type: 'spam', priority: 0 };
    const haywireCard: Card = { id: 'hw1', type: 'haywireMove1RotateMove1', priority: 0 };
    const regularCard: Card = { id: 'move1', type: 'move1', priority: 500 };
    player.hand = [spamCard, haywireCard, regularCard];
    state.players = [player];
    state.damageDeck = [
      { id: 'spam2', type: 'spam', priority: 0 },
      { id: 'spam3', type: 'spam', priority: 0 },
    ];

    respawnDestroyedRobots(state);

    // Hand should only contain non-damage cards
    expect(player.hand.some(c => c.type === 'spam')).toBe(false);
    expect(player.hand.some(c => c.type === 'haywireMove1RotateMove1')).toBe(false);
    // SPAM should be in player's discard pile
    expect(player.discardPile.some(c => c.type === 'spam')).toBe(true);
    // Haywire should be in damage discard pile
    expect(state.damageDiscardPile.some(c => c.type === 'haywireMove1RotateMove1')).toBe(true);
  });

  it('resets damage counter on reboot', () => {
    state.board.rebootToken = { x: 1, y: 1, pushDirection: 'east' };
    const player = createTestPlayer('p1', 4, 4);
    player.robot.isDestroyed = true;
    player.robot.lives = 2;
    player.robot.damage = 5;
    state.players = [player];
    // Note: After reboot, robot draws 2 damage cards so damage will be 2
    state.damageDeck = [
      { id: 'spam1', type: 'spam', priority: 0 },
      { id: 'spam2', type: 'spam', priority: 0 },
    ];

    respawnDestroyedRobots(state);

    // Damage should be reset to 0, then +2 from reboot damage
    expect(player.robot.damage).toBe(2);
  });
});

describe('executeRegisterWithEvents - animation events', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('SPAM card replacement emits player_card event for replacement card', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    const spamCard: Card = { id: 'spam1', type: 'spam', priority: 0 };
    const replacementCard: Card = { id: 'move1-replacement', type: 'move1', priority: 0 };
    player.registers = [spamCard, null, null, null, null];
    player.deck = [replacementCard];
    player.robot.damage = 1;
    state.players = [player];

    const events = executeRegisterWithEvents(state, 0);

    // Should have player_card events for both SPAM and replacement
    const playerCardEvents = events.filter(e => e.type === 'player_card') as PlayerCardEvent[];
    expect(playerCardEvents.length).toBe(2);

    // First event is for SPAM card
    expect(playerCardEvents[0].card.type).toBe('spam');

    // Second event is for replacement card
    expect(playerCardEvents[1].card.type).toBe('move1');
    expect(playerCardEvents[1].card.id).toBe('move1-replacement');
  });

  it('Again card in register 0 emits player_card event for replacement card', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    const againCard: Card = { id: 'again1', type: 'again', priority: 0 };
    const replacementCard: Card = { id: 'move2-replacement', type: 'move2', priority: 0 };
    player.registers = [againCard, null, null, null, null];
    player.deck = [replacementCard];
    state.players = [player];

    const events = executeRegisterWithEvents(state, 0);

    // Should have player_card events for both Again and replacement
    const playerCardEvents = events.filter(e => e.type === 'player_card') as PlayerCardEvent[];
    expect(playerCardEvents.length).toBe(2);

    // First event is for Again card
    expect(playerCardEvents[0].card.type).toBe('again');

    // Second event is for replacement card
    expect(playerCardEvents[1].card.type).toBe('move2');
    expect(playerCardEvents[1].card.id).toBe('move2-replacement');
  });

  it('Again card in register > 0 does not draw replacement', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    const move1Card: Card = { id: 'move1', type: 'move1', priority: 0 };
    const againCard: Card = { id: 'again1', type: 'again', priority: 0 };
    player.registers = [move1Card, againCard, null, null, null];
    state.players = [player];

    // Execute register 0 first
    executeRegisterWithEvents(state, 0);

    // Execute register 1 with Again card
    const events = executeRegisterWithEvents(state, 1);

    // Should only have one player_card event (for Again, which repeats move1)
    const playerCardEvents = events.filter(e => e.type === 'player_card') as PlayerCardEvent[];
    expect(playerCardEvents.length).toBe(1);
    expect(playerCardEvents[0].card.type).toBe('again');
  });

  it('generates register_start and register_end events', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    player.registers = [createTestCard('move1'), null, null, null, null];
    state.players = [player];

    const events = executeRegisterWithEvents(state, 0);

    expect(events[0].type).toBe('register_start');
    expect((events[0] as any).registerIndex).toBe(0);

    expect(events[events.length - 1].type).toBe('register_end');
    expect((events[events.length - 1] as any).registerIndex).toBe(0);
  });

  it('generates robot_move events for movement cards', () => {
    const player = createTestPlayer('p1', 3, 3, 'north');
    player.registers = [createTestCard('move2'), null, null, null, null];
    state.players = [player];

    const events = executeRegisterWithEvents(state, 0);

    const moveEvents = events.filter(e => e.type === 'robot_move');
    expect(moveEvents.length).toBe(2); // move2 = 2 moves
  });
});

