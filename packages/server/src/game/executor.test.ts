import { describe, it, expect, beforeEach } from 'vitest';
import { executeRegister } from './executor';
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

describe('executeRegister - priority', () => {
  let state: GameState;

  beforeEach(() => {
    state = createTestGameState(10, 10);
  });

  it('executes higher priority cards first', () => {
    // Two robots facing same direction, one behind the other
    const player1 = createTestPlayer('p1', 5, 6, 'north'); // behind
    const player2 = createTestPlayer('p2', 5, 5, 'north'); // in front

    // Player 1 has lower priority, player 2 has higher
    player1.registers = [createTestCard('move1', 100), null, null, null, null];
    player2.registers = [createTestCard('move1', 800), null, null, null, null];

    state.players = [player1, player2];
    executeRegister(state, 0);

    // Player 2 moves first (higher priority) to (5,4)
    // Then player 1 moves to (5,5) - the spot player 2 vacated
    expect(player2.robot.position).toEqual({ x: 5, y: 4 });
    expect(player1.robot.position).toEqual({ x: 5, y: 5 });
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
