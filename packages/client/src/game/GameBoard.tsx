import { Stage, Container, Sprite, Text, Graphics } from '@pixi/react';
import { useCallback, useMemo } from 'react';
import type { Board, Player, Direction, Tile } from '@circuit-chaos/shared';
import { TILE_SIZE } from '@circuit-chaos/shared';
import * as PIXI from 'pixi.js';

// Import tile assets
import floorTile from '../assets/tiles/floor.svg';
import pitTile from '../assets/tiles/pit.svg';
import repairTile from '../assets/tiles/repair.svg';
import conveyorTile from '../assets/tiles/conveyor.svg';
import conveyorFastTile from '../assets/tiles/conveyor-fast.svg';
import gearCwTile from '../assets/tiles/gear-cw.svg';
import gearCcwTile from '../assets/tiles/gear-ccw.svg';
import checkpointTile from '../assets/tiles/checkpoint.svg';
import wallTile from '../assets/tiles/wall.svg';
import robotSprite from '../assets/robot.svg';

interface Props {
  board: Board;
  players: Player[];
}

// Direction to rotation angle (in radians)
const directionToRotation: Record<Direction, number> = {
  north: 0,
  east: Math.PI / 2,
  south: Math.PI,
  west: -Math.PI / 2,
};

function getTileTexture(tile: Tile): string {
  switch (tile.type) {
    case 'pit': return pitTile;
    case 'repair': return repairTile;
    case 'conveyor': return tile.speed === 2 ? conveyorFastTile : conveyorTile;
    case 'gear': return tile.rotation === 'cw' ? gearCwTile : gearCcwTile;
    default: return floorTile;
  }
}

function getTileRotation(tile: Tile): number {
  if (tile.type === 'conveyor') {
    return directionToRotation[tile.direction];
  }
  return 0;
}

export function GameBoard({ board, players }: Props) {
  const width = board.width * TILE_SIZE;
  const height = board.height * TILE_SIZE;

  // Create tile elements
  const tiles = useMemo(() => {
    const elements: JSX.Element[] = [];

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const tile = board.tiles[y][x];
        const texture = getTileTexture(tile);
        const rotation = getTileRotation(tile);

        elements.push(
          <Sprite
            key={`tile-${x}-${y}`}
            image={texture}
            x={x * TILE_SIZE + TILE_SIZE / 2}
            y={y * TILE_SIZE + TILE_SIZE / 2}
            width={TILE_SIZE}
            height={TILE_SIZE}
            anchor={0.5}
            rotation={rotation}
          />
        );
      }
    }

    return elements;
  }, [board.tiles, board.width, board.height]);

  // Create checkpoint overlays
  const checkpoints = useMemo(() => {
    return board.checkpoints.map((cp) => (
      <Container key={`cp-${cp.order}`}>
        <Sprite
          image={checkpointTile}
          x={cp.x * TILE_SIZE + TILE_SIZE / 2}
          y={cp.y * TILE_SIZE + TILE_SIZE / 2}
          width={TILE_SIZE}
          height={TILE_SIZE}
          anchor={0.5}
        />
        <Text
          text={String(cp.order)}
          x={cp.x * TILE_SIZE + TILE_SIZE * 0.5}
          y={cp.y * TILE_SIZE + TILE_SIZE * 0.38}
          anchor={0.5}
          style={
            new PIXI.TextStyle({
              fill: '#fef3c7',
              fontSize: 16,
              fontWeight: 'bold',
              fontFamily: 'monospace',
            })
          }
        />
      </Container>
    ));
  }, [board.checkpoints]);

  // Draw walls
  const drawWalls = useCallback((g: PIXI.Graphics) => {
    g.clear();

    for (const wall of board.walls) {
      const px = wall.x * TILE_SIZE;
      const py = wall.y * TILE_SIZE;
      const wallThickness = 8;

      // Warning stripes pattern
      const stripeSize = 8;

      switch (wall.side) {
        case 'north':
          // Main wall body
          g.beginFill(0x1f2937);
          g.drawRect(px, py - wallThickness / 2, TILE_SIZE, wallThickness);
          g.endFill();
          // Yellow stripes
          for (let i = 0; i < TILE_SIZE; i += stripeSize * 2) {
            g.beginFill(0xfbbf24);
            g.drawRect(px + i, py - wallThickness / 2, stripeSize, wallThickness);
            g.endFill();
          }
          // Top highlight
          g.lineStyle(2, 0x6b7280);
          g.moveTo(px, py - wallThickness / 2);
          g.lineTo(px + TILE_SIZE, py - wallThickness / 2);
          break;
        case 'south':
          g.beginFill(0x1f2937);
          g.drawRect(px, py + TILE_SIZE - wallThickness / 2, TILE_SIZE, wallThickness);
          g.endFill();
          for (let i = 0; i < TILE_SIZE; i += stripeSize * 2) {
            g.beginFill(0xfbbf24);
            g.drawRect(px + i, py + TILE_SIZE - wallThickness / 2, stripeSize, wallThickness);
            g.endFill();
          }
          g.lineStyle(2, 0x6b7280);
          g.moveTo(px, py + TILE_SIZE - wallThickness / 2);
          g.lineTo(px + TILE_SIZE, py + TILE_SIZE - wallThickness / 2);
          break;
        case 'east':
          g.beginFill(0x1f2937);
          g.drawRect(px + TILE_SIZE - wallThickness / 2, py, wallThickness, TILE_SIZE);
          g.endFill();
          for (let i = 0; i < TILE_SIZE; i += stripeSize * 2) {
            g.beginFill(0xfbbf24);
            g.drawRect(px + TILE_SIZE - wallThickness / 2, py + i, wallThickness, stripeSize);
            g.endFill();
          }
          g.lineStyle(2, 0x6b7280);
          g.moveTo(px + TILE_SIZE - wallThickness / 2, py);
          g.lineTo(px + TILE_SIZE - wallThickness / 2, py + TILE_SIZE);
          break;
        case 'west':
          g.beginFill(0x1f2937);
          g.drawRect(px - wallThickness / 2, py, wallThickness, TILE_SIZE);
          g.endFill();
          for (let i = 0; i < TILE_SIZE; i += stripeSize * 2) {
            g.beginFill(0xfbbf24);
            g.drawRect(px - wallThickness / 2, py + i, wallThickness, stripeSize);
            g.endFill();
          }
          g.lineStyle(2, 0x6b7280);
          g.moveTo(px - wallThickness / 2, py);
          g.lineTo(px - wallThickness / 2, py + TILE_SIZE);
          break;
      }
    }
  }, [board.walls]);

  // Draw lasers
  const drawLasers = useCallback((g: PIXI.Graphics) => {
    g.clear();

    for (const laser of board.lasers) {
      const px = laser.x * TILE_SIZE + TILE_SIZE / 2;
      const py = laser.y * TILE_SIZE + TILE_SIZE / 2;

      // Calculate beam start and end points
      let beamStartX = px;
      let beamStartY = py;
      let beamEndX = px;
      let beamEndY = py;

      // Emitter is mounted on the wall, beam shoots into the tile
      const emitterOffset = TILE_SIZE / 2 - 4;

      switch (laser.direction) {
        case 'north':
          beamStartY = py + emitterOffset;
          beamEndY = 0;
          break;
        case 'south':
          beamStartY = py - emitterOffset;
          beamEndY = height;
          break;
        case 'east':
          beamStartX = px - emitterOffset;
          beamEndX = width;
          break;
        case 'west':
          beamStartX = px + emitterOffset;
          beamEndX = 0;
          break;
      }

      // Draw laser beam (subtle, extending across board)
      // Outer glow
      g.lineStyle(6, 0xef4444, 0.15);
      g.moveTo(beamStartX, beamStartY);
      g.lineTo(beamEndX, beamEndY);
      // Inner beam
      g.lineStyle(2, 0xef4444, 0.4);
      g.moveTo(beamStartX, beamStartY);
      g.lineTo(beamEndX, beamEndY);
      // Core beam
      g.lineStyle(1, 0xfca5a5, 0.6);
      g.moveTo(beamStartX, beamStartY);
      g.lineTo(beamEndX, beamEndY);

      // Draw emitter mounted on wall edge, pointing inward
      g.lineStyle(0);

      switch (laser.direction) {
        case 'north':
          // Emitter at bottom of tile, shooting up
          g.beginFill(0x374151);
          g.drawRect(px - 10, py + emitterOffset - 4, 20, 8);
          g.endFill();
          g.beginFill(0xef4444);
          g.drawRect(px - 6, py + emitterOffset - 6, 12, 6);
          g.endFill();
          g.beginFill(0xfca5a5);
          g.drawRect(px - 3, py + emitterOffset - 8, 6, 4);
          g.endFill();
          break;
        case 'south':
          // Emitter at top of tile, shooting down
          g.beginFill(0x374151);
          g.drawRect(px - 10, py - emitterOffset - 4, 20, 8);
          g.endFill();
          g.beginFill(0xef4444);
          g.drawRect(px - 6, py - emitterOffset, 12, 6);
          g.endFill();
          g.beginFill(0xfca5a5);
          g.drawRect(px - 3, py - emitterOffset + 4, 6, 4);
          g.endFill();
          break;
        case 'east':
          // Emitter at left of tile, shooting right
          g.beginFill(0x374151);
          g.drawRect(px - emitterOffset - 4, py - 10, 8, 20);
          g.endFill();
          g.beginFill(0xef4444);
          g.drawRect(px - emitterOffset, py - 6, 6, 12);
          g.endFill();
          g.beginFill(0xfca5a5);
          g.drawRect(px - emitterOffset + 4, py - 3, 4, 6);
          g.endFill();
          break;
        case 'west':
          // Emitter at right of tile, shooting left
          g.beginFill(0x374151);
          g.drawRect(px + emitterOffset - 4, py - 10, 8, 20);
          g.endFill();
          g.beginFill(0xef4444);
          g.drawRect(px + emitterOffset - 6, py - 6, 6, 12);
          g.endFill();
          g.beginFill(0xfca5a5);
          g.drawRect(px + emitterOffset - 8, py - 3, 4, 6);
          g.endFill();
          break;
      }
    }
  }, [board.lasers, width, height]);

  // Create robot sprites
  const robots = useMemo(() => {
    return players
      .filter((player) => !player.robot.isDestroyed)
      .map((player) => {
        const { robot } = player;
        const rotation = directionToRotation[robot.direction];

        return (
          <Container key={player.id}>
            <Sprite
              image={robotSprite}
              x={robot.position.x * TILE_SIZE + TILE_SIZE / 2}
              y={robot.position.y * TILE_SIZE + TILE_SIZE / 2}
              width={TILE_SIZE * 0.9}
              height={TILE_SIZE * 0.9}
              anchor={0.5}
              rotation={rotation}
              tint={parseInt(player.color.slice(1), 16)}
            />
            {/* Player name label */}
            <Text
              text={player.name.slice(0, 8)}
              x={robot.position.x * TILE_SIZE + TILE_SIZE / 2}
              y={robot.position.y * TILE_SIZE + TILE_SIZE + 4}
              anchor={[0.5, 0]}
              style={
                new PIXI.TextStyle({
                  fill: '#ffffff',
                  fontSize: 10,
                  fontWeight: 'bold',
                  fontFamily: 'monospace',
                  dropShadow: true,
                  dropShadowColor: '#000000',
                  dropShadowDistance: 1,
                })
              }
            />
          </Container>
        );
      });
  }, [players]);

  return (
    <Stage
      width={width}
      height={height + 20}
      options={{ backgroundColor: 0x1a1a2e, antialias: false }}
    >
      <Container>
        {/* Tiles layer */}
        {tiles}

        {/* Checkpoints layer */}
        {checkpoints}

        {/* Walls layer */}
        <Graphics draw={drawWalls} />

        {/* Lasers layer */}
        <Graphics draw={drawLasers} />

        {/* Robots layer (on top) */}
        {robots}
      </Container>
    </Stage>
  );
}
