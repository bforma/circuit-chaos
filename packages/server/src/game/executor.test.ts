import { describe, it, expect, beforeEach } from 'vitest';
import { executeRegister, respawnDestroyedRobots } from './executor';
import {
  GameState,
  Player,
  Board,
  Card,
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

    respawnDestroyedRobots(state);

    expect(player.robot.isDestroyed).toBe(false);
    expect(player.robot.position).toEqual({ x: 2, y: 2 });
    expect(player.robot.damage).toBe(2); // Respawns with 2 damage
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

