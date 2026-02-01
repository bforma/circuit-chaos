import { Stage, Container, Sprite, Text, Graphics, useApp } from '@pixi/react';
import { useCallback, useMemo, useEffect, useRef } from 'react';
import type { Board, Player, Direction, Tile, ThemeId } from '@circuit-chaos/shared';
import { TILE_SIZE } from '@circuit-chaos/shared';
import * as PIXI from 'pixi.js';
import robotSprite from '../assets/robot.svg';
import { useGameStore } from '../stores/gameStore';
import { useAnimationStore } from '../stores/animationStore';
import { calculatePreviewPosition } from './previewCalculator';
import { AnimatedRobot } from './AnimatedRobot';

// Shared text style for checkpoints (created once)
const checkpointTextStyle = new PIXI.TextStyle({
  fill: '#fef3c7',
  fontSize: 16,
  fontWeight: 'bold',
  fontFamily: 'monospace',
});

// Component to control ticker based on animation state (must be inside Stage)
function TickerController({ renderTrigger }: { renderTrigger: unknown }) {
  const app = useApp();
  const isProcessingQueue = useAnimationStore((state) => state.isProcessingQueue);
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (isProcessingQueue) {
      // Start ticker for animations
      app.ticker.start();
    } else if (hasInitialized.current) {
      // Only stop ticker after initial load is complete
      app.ticker.stop();
      app.render();
    }
  }, [isProcessingQueue, app]);

  // Wait for initial textures to load before stopping ticker
  useEffect(() => {
    const timer = setTimeout(() => {
      hasInitialized.current = true;
      if (!useAnimationStore.getState().isProcessingQueue) {
        app.ticker.stop();
        app.render();
      }
    }, 500); // Give textures time to load

    return () => {
      clearTimeout(timer);
      app.ticker.stop();
    };
  }, [app]);

  // Re-render when external state changes (like ghost preview)
  useEffect(() => {
    if (!isProcessingQueue && hasInitialized.current) {
      app.render();
    }
  }, [renderTrigger, isProcessingQueue, app]);

  return null;
}

// Theme tile imports - organized by theme
const themeAssets: Record<ThemeId, Record<string, string>> = {
  industrial: {
    floor: new URL('../assets/themes/industrial/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/industrial/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/industrial/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/industrial/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/industrial/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/industrial/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/industrial/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/industrial/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/industrial/battery.svg', import.meta.url).href,
  },
  candy: {
    floor: new URL('../assets/themes/candy/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/candy/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/candy/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/candy/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/candy/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/candy/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/candy/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/candy/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/candy/battery.svg', import.meta.url).href,
  },
  neon: {
    floor: new URL('../assets/themes/neon/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/neon/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/neon/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/neon/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/neon/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/neon/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/neon/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/neon/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/neon/battery.svg', import.meta.url).href,
  },
  nature: {
    floor: new URL('../assets/themes/nature/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/nature/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/nature/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/nature/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/nature/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/nature/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/nature/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/nature/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/nature/battery.svg', import.meta.url).href,
  },
  space: {
    floor: new URL('../assets/themes/space/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/space/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/space/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/space/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/space/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/space/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/space/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/space/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/space/battery.svg', import.meta.url).href,
  },
  ocean: {
    floor: new URL('../assets/themes/ocean/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/ocean/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/ocean/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/ocean/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/ocean/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/ocean/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/ocean/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/ocean/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/ocean/battery.svg', import.meta.url).href,
  },
  lava: {
    floor: new URL('../assets/themes/lava/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/lava/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/lava/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/lava/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/lava/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/lava/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/lava/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/lava/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/lava/battery.svg', import.meta.url).href,
  },
  ice: {
    floor: new URL('../assets/themes/ice/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/ice/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/ice/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/ice/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/ice/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/ice/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/ice/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/ice/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/ice/battery.svg', import.meta.url).href,
  },
  jungle: {
    floor: new URL('../assets/themes/jungle/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/jungle/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/jungle/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/jungle/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/jungle/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/jungle/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/jungle/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/jungle/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/jungle/battery.svg', import.meta.url).href,
  },
  steampunk: {
    floor: new URL('../assets/themes/steampunk/floor.svg', import.meta.url).href,
    pit: new URL('../assets/themes/steampunk/pit.svg', import.meta.url).href,
    repair: new URL('../assets/themes/steampunk/repair.svg', import.meta.url).href,
    conveyor: new URL('../assets/themes/steampunk/conveyor.svg', import.meta.url).href,
    conveyorFast: new URL('../assets/themes/steampunk/conveyor-fast.svg', import.meta.url).href,
    gearCw: new URL('../assets/themes/steampunk/gear-cw.svg', import.meta.url).href,
    gearCcw: new URL('../assets/themes/steampunk/gear-ccw.svg', import.meta.url).href,
    checkpoint: new URL('../assets/themes/steampunk/checkpoint.svg', import.meta.url).href,
    battery: new URL('../assets/themes/steampunk/battery.svg', import.meta.url).href,
  },
};

interface Props {
  board: Board;
  players: Player[];
  theme?: ThemeId;
}

// Direction to rotation angle (in radians)
const directionToRotation: Record<Direction, number> = {
  north: 0,
  east: Math.PI / 2,
  south: Math.PI,
  west: -Math.PI / 2,
};

function getTileTexture(tile: Tile, theme: ThemeId): string {
  const assets = themeAssets[theme];
  switch (tile.type) {
    case 'pit': return assets.pit;
    case 'repair': return assets.repair;
    case 'conveyor': return tile.speed === 2 ? assets.conveyorFast : assets.conveyor;
    case 'gear': return tile.rotation === 'cw' ? assets.gearCw : assets.gearCcw;
    case 'battery': return assets.battery;
    default: return assets.floor;
  }
}

function getTileRotation(tile: Tile): number {
  if (tile.type === 'conveyor') {
    return directionToRotation[tile.direction];
  }
  return 0;
}

export function GameBoard({ board, players, theme = 'industrial' }: Props) {
  const width = board.width * TILE_SIZE;
  const height = board.height * TILE_SIZE;

  const { gameState, getCurrentPlayer, hoveredCard } = useGameStore();
  const currentPlayer = getCurrentPlayer();
  const cardPreviewEnabled = gameState?.cardPreviewEnabled ?? false;

  // Animation store state
  const laserBeams = useAnimationStore((state) => state.laserBeams);
  const processEvents = useAnimationStore((state) => state.processEvents);
  const clearExpiredLasers = useAnimationStore((state) => state.clearExpiredLasers);
  const isProcessingQueue = useAnimationStore((state) => state.isProcessingQueue);

  // Process animation events using requestAnimationFrame (more efficient than setInterval)
  useEffect(() => {
    if (!isProcessingQueue) return;

    let animationFrameId: number;
    const tick = () => {
      processEvents();
      clearExpiredLasers();
      // Only continue if still processing
      if (useAnimationStore.getState().isProcessingQueue) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };
    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [isProcessingQueue, processEvents, clearExpiredLasers]);

  // Create tile elements
  const tiles = useMemo(() => {
    const elements: JSX.Element[] = [];

    for (let y = 0; y < board.height; y++) {
      for (let x = 0; x < board.width; x++) {
        const tile = board.tiles[y][x];
        const texture = getTileTexture(tile, theme);
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
  }, [board.tiles, board.width, board.height, theme]);

  // Create checkpoint overlays
  const checkpoints = useMemo(() => {
    const checkpointAsset = themeAssets[theme].checkpoint;
    return board.checkpoints.map((cp) => (
      <Container key={`cp-${cp.order}`}>
        <Sprite
          image={checkpointAsset}
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
          style={checkpointTextStyle}
        />
      </Container>
    ));
  }, [board.checkpoints, theme]);

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

  // Create animated robot components
  const robots = useMemo(() => {
    return players
      .filter((player) => !player.robot.isDestroyed)
      .map((player) => (
        <AnimatedRobot
          key={player.id}
          playerId={player.id}
          playerName={player.name}
          playerColor={player.color}
          isAI={player.isAI}
          fallbackX={player.robot.position.x}
          fallbackY={player.robot.position.y}
          fallbackDirection={player.robot.direction}
          fallbackIsDestroyed={player.robot.isDestroyed}
        />
      ));
  }, [players]);

  // Draw animated laser beams
  const drawAnimatedLasers = useCallback(
    (g: PIXI.Graphics) => {
      g.clear();

      for (const beam of laserBeams) {
        const startX = beam.startX * TILE_SIZE + TILE_SIZE / 2;
        const startY = beam.startY * TILE_SIZE + TILE_SIZE / 2;
        const endX = beam.endX * TILE_SIZE + TILE_SIZE / 2;
        const endY = beam.endY * TILE_SIZE + TILE_SIZE / 2;

        // Bright animated laser beam
        // Outer glow
        g.lineStyle(8, 0xff0000, 0.3);
        g.moveTo(startX, startY);
        g.lineTo(endX, endY);
        // Middle beam
        g.lineStyle(4, 0xff4444, 0.6);
        g.moveTo(startX, startY);
        g.lineTo(endX, endY);
        // Core beam
        g.lineStyle(2, 0xffaaaa, 0.9);
        g.moveTo(startX, startY);
        g.lineTo(endX, endY);
      }
    },
    [laserBeams]
  );


  // Calculate ghost preview position
  const ghostPreview = useMemo(() => {
    if (!cardPreviewEnabled || !hoveredCard || !currentPlayer || currentPlayer.robot.isDestroyed) {
      return null;
    }

    // Don't show preview if hovered card is already in a register
    const isAlreadyInRegister = currentPlayer.registers.some(r => r?.id === hoveredCard.id);
    if (isAlreadyInRegister) {
      return null;
    }

    // Build the card sequence: current registers + hovered card in first empty slot
    const cardsToSimulate: (typeof hoveredCard | null)[] = [...currentPlayer.registers];

    // Find first empty register and put hovered card there
    const emptyIndex = cardsToSimulate.findIndex(c => c === null);
    if (emptyIndex === -1) {
      return null; // No empty register
    }

    cardsToSimulate[emptyIndex] = hoveredCard;

    // Only simulate up to and including the hovered card position
    const cardsUpToHovered = cardsToSimulate.slice(0, emptyIndex + 1);

    return calculatePreviewPosition(currentPlayer, board, cardsUpToHovered);
  }, [cardPreviewEnabled, hoveredCard, currentPlayer, board]);

  // Render ghost robot
  const ghostRobot = useMemo(() => {
    if (!ghostPreview || ghostPreview.isDestroyed || !currentPlayer) {
      return null;
    }

    const ghostX = ghostPreview.x * TILE_SIZE + TILE_SIZE / 2;
    const ghostY = ghostPreview.y * TILE_SIZE + TILE_SIZE / 2;
    const rotation = directionToRotation[ghostPreview.direction];
    const colorInt = parseInt(currentPlayer.color.slice(1), 16);

    return (
      <Container key="ghost">
        <Sprite
          image={robotSprite}
          x={ghostX}
          y={ghostY}
          width={TILE_SIZE * 0.9}
          height={TILE_SIZE * 0.9}
          anchor={0.5}
          rotation={rotation}
          tint={colorInt}
          alpha={0.4}
        />
      </Container>
    );
  }, [ghostPreview, currentPlayer]);

  return (
    <Stage
      width={width}
      height={height + 20}
      options={{ backgroundColor: 0x1a1a2e, antialias: false }}
    >
      <TickerController renderTrigger={ghostPreview} />
      <Container>
        {/* Tiles layer */}
        {tiles}

        {/* Checkpoints layer */}
        {checkpoints}

        {/* Walls layer */}
        <Graphics draw={drawWalls} />

        {/* Static lasers layer (board lasers) */}
        <Graphics draw={drawLasers} />

        {/* Animated laser beams layer */}
        <Graphics draw={drawAnimatedLasers} />

        {/* Ghost preview layer */}
        {ghostRobot}

        {/* Robots layer (on top) */}
        {robots}
      </Container>
    </Stage>
  );
}
