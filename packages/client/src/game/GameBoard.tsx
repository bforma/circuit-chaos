import { Stage, Container, Graphics, Text } from '@pixi/react';
import { useCallback, useMemo } from 'react';
import type { Board, Player, Tile, Direction } from '@circuit-chaos/shared';
import { TILE_SIZE } from '@circuit-chaos/shared';
import * as PIXI from 'pixi.js';

interface Props {
  board: Board;
  players: Player[];
}

const COLORS = {
  floor: 0x2d3436,
  pit: 0x1a1a1a,
  repair: 0x27ae60,
  conveyor: 0x3498db,
  conveyorFast: 0x2980b9,
  gear: 0x9b59b6,
  wall: 0x7f8c8d,
  laser: 0xe74c3c,
  checkpoint: 0xf39c12,
  grid: 0x404040,
};

export function GameBoard({ board, players }: Props) {
  const width = board.width * TILE_SIZE;
  const height = board.height * TILE_SIZE;

  const drawTile = useCallback((g: PIXI.Graphics, tile: Tile, x: number, y: number) => {
    const px = x * TILE_SIZE;
    const py = y * TILE_SIZE;

    // Base tile
    let color = COLORS.floor;
    switch (tile.type) {
      case 'pit': color = COLORS.pit; break;
      case 'repair': color = COLORS.repair; break;
      case 'conveyor': color = tile.speed === 2 ? COLORS.conveyorFast : COLORS.conveyor; break;
      case 'gear': color = COLORS.gear; break;
    }

    g.beginFill(color);
    g.drawRect(px, py, TILE_SIZE, TILE_SIZE);
    g.endFill();

    // Grid lines
    g.lineStyle(1, COLORS.grid, 0.5);
    g.drawRect(px, py, TILE_SIZE, TILE_SIZE);

    // Conveyor arrows
    if (tile.type === 'conveyor') {
      drawArrow(g, px, py, tile.direction, 0xffffff);
    }

    // Gear rotation indicator
    if (tile.type === 'gear') {
      g.lineStyle(2, 0xffffff, 0.6);
      g.drawCircle(px + TILE_SIZE / 2, py + TILE_SIZE / 2, TILE_SIZE / 3);
      // Arrow for rotation direction
      const cx = px + TILE_SIZE / 2;
      const cy = py + TILE_SIZE / 2;
      const r = TILE_SIZE / 3;
      if (tile.rotation === 'cw') {
        g.moveTo(cx + r, cy);
        g.lineTo(cx + r - 8, cy - 6);
        g.moveTo(cx + r, cy);
        g.lineTo(cx + r - 8, cy + 6);
      } else {
        g.moveTo(cx - r, cy);
        g.lineTo(cx - r + 8, cy - 6);
        g.moveTo(cx - r, cy);
        g.lineTo(cx - r + 8, cy + 6);
      }
    }
  }, []);

  const drawArrow = (g: PIXI.Graphics, px: number, py: number, direction: Direction, color: number) => {
    const cx = px + TILE_SIZE / 2;
    const cy = py + TILE_SIZE / 2;
    const size = 12;

    g.lineStyle(2, color, 0.7);
    g.beginFill(color, 0.3);

    switch (direction) {
      case 'north':
        g.moveTo(cx, cy - size);
        g.lineTo(cx - size / 2, cy + size / 2);
        g.lineTo(cx + size / 2, cy + size / 2);
        break;
      case 'south':
        g.moveTo(cx, cy + size);
        g.lineTo(cx - size / 2, cy - size / 2);
        g.lineTo(cx + size / 2, cy - size / 2);
        break;
      case 'east':
        g.moveTo(cx + size, cy);
        g.lineTo(cx - size / 2, cy - size / 2);
        g.lineTo(cx - size / 2, cy + size / 2);
        break;
      case 'west':
        g.moveTo(cx - size, cy);
        g.lineTo(cx + size / 2, cy - size / 2);
        g.lineTo(cx + size / 2, cy + size / 2);
        break;
    }
    g.closePath();
    g.endFill();
  };

  const drawBoard = useCallback((g: PIXI.Graphics) => {
    g.clear();

    // Draw tiles
    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        drawTile(g, board.tiles[y][x], x, y);
      }
    }

    // Draw walls
    g.lineStyle(4, COLORS.wall);
    for (const wall of board.walls) {
      const px = wall.x * TILE_SIZE;
      const py = wall.y * TILE_SIZE;
      switch (wall.side) {
        case 'north':
          g.moveTo(px, py);
          g.lineTo(px + TILE_SIZE, py);
          break;
        case 'south':
          g.moveTo(px, py + TILE_SIZE);
          g.lineTo(px + TILE_SIZE, py + TILE_SIZE);
          break;
        case 'east':
          g.moveTo(px + TILE_SIZE, py);
          g.lineTo(px + TILE_SIZE, py + TILE_SIZE);
          break;
        case 'west':
          g.moveTo(px, py);
          g.lineTo(px, py + TILE_SIZE);
          break;
      }
    }

    // Draw lasers
    g.lineStyle(2, COLORS.laser, 0.8);
    for (const laser of board.lasers) {
      const px = laser.x * TILE_SIZE + TILE_SIZE / 2;
      const py = laser.y * TILE_SIZE + TILE_SIZE / 2;
      g.beginFill(COLORS.laser, 0.3);
      g.drawCircle(px, py, 8);
      g.endFill();
    }

    // Draw checkpoints
    for (const cp of board.checkpoints) {
      const px = cp.x * TILE_SIZE;
      const py = cp.y * TILE_SIZE;
      g.lineStyle(3, COLORS.checkpoint);
      g.beginFill(COLORS.checkpoint, 0.3);
      g.drawRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
      g.endFill();
    }
  }, [board, drawTile]);

  const drawRobots = useCallback((g: PIXI.Graphics) => {
    g.clear();

    for (const player of players) {
      const { robot } = player;
      if (robot.isDestroyed) continue;

      const px = robot.position.x * TILE_SIZE + TILE_SIZE / 2;
      const py = robot.position.y * TILE_SIZE + TILE_SIZE / 2;
      const color = parseInt(player.color.slice(1), 16);

      // Robot body
      g.lineStyle(2, 0xffffff);
      g.beginFill(color);
      g.drawCircle(px, py, TILE_SIZE / 3);
      g.endFill();

      // Direction indicator
      const dirOffset = {
        north: { dx: 0, dy: -1 },
        south: { dx: 0, dy: 1 },
        east: { dx: 1, dy: 0 },
        west: { dx: -1, dy: 0 },
      }[robot.direction];

      g.lineStyle(3, 0xffffff);
      g.moveTo(px, py);
      g.lineTo(px + dirOffset.dx * (TILE_SIZE / 3), py + dirOffset.dy * (TILE_SIZE / 3));
    }
  }, [players]);

  return (
    <Stage
      width={width}
      height={height}
      options={{ backgroundColor: 0x1a1a2e, antialias: true }}
    >
      <Container>
        <Graphics draw={drawBoard} />
        <Graphics draw={drawRobots} />
        {board.checkpoints.map((cp) => (
          <Text
            key={cp.order}
            text={String(cp.order)}
            x={cp.x * TILE_SIZE + TILE_SIZE / 2}
            y={cp.y * TILE_SIZE + TILE_SIZE / 2}
            anchor={0.5}
            style={
              new PIXI.TextStyle({
                fill: 0xf39c12,
                fontSize: 20,
                fontWeight: 'bold',
              })
            }
          />
        ))}
      </Container>
    </Stage>
  );
}
