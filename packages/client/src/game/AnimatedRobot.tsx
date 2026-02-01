import { Container, Sprite, Text } from '@pixi/react';
import { useTick } from '@pixi/react';
import { useState, useEffect, useRef } from 'react';
import * as PIXI from 'pixi.js';
import type { Direction } from '@circuit-chaos/shared';
import { TILE_SIZE } from '@circuit-chaos/shared';
import robotSprite from '../assets/robot.svg';
import { useAnimationStore } from '../stores/animationStore';

// Shared text style (created once, reused)
const nameTextStyle = new PIXI.TextStyle({
  fill: '#ffffff',
  fontSize: 10,
  fontWeight: 'bold',
  fontFamily: 'monospace',
  dropShadow: true,
  dropShadowColor: '#000000',
  dropShadowDistance: 1,
});

interface Props {
  playerId: string;
  playerName: string;
  playerColor: string;
  isAI: boolean;
  fallbackX: number;
  fallbackY: number;
  fallbackDirection: Direction;
  fallbackIsDestroyed: boolean;
}

// Direction to rotation angle (in radians)
const directionToRotation: Record<Direction, number> = {
  north: 0,
  east: Math.PI / 2,
  south: Math.PI,
  west: -Math.PI / 2,
};

// Interpolation speed (0-1, higher = faster)
const LERP_SPEED = 0.15;
const ROTATION_LERP_SPEED = 0.2;

// Normalize angle to [-PI, PI]
function normalizeAngle(angle: number): number {
  while (angle > Math.PI) angle -= 2 * Math.PI;
  while (angle < -Math.PI) angle += 2 * Math.PI;
  return angle;
}

// Find shortest rotation path
function shortestRotation(from: number, to: number): number {
  const diff = normalizeAngle(to - from);
  return diff;
}

export function AnimatedRobot({
  playerId,
  playerName,
  playerColor,
  isAI,
  fallbackX,
  fallbackY,
  fallbackDirection,
  fallbackIsDestroyed,
}: Props) {
  const robotVisual = useAnimationStore((state) => state.getRobotVisual(playerId));
  const isProcessing = useAnimationStore((state) => state.isProcessingQueue);

  // Use robotVisual position if available, otherwise fallback to game state
  // During animation: robotVisual has current interpolated pos and target pos
  // After animation: robotVisual.x/y are synced to final position
  const currentX = robotVisual?.x ?? fallbackX;
  const currentY = robotVisual?.y ?? fallbackY;
  const currentDirection = robotVisual?.direction ?? fallbackDirection;

  // Current interpolated values - initialized from robotVisual or fallback
  const [displayX, setDisplayX] = useState(currentX);
  const [displayY, setDisplayY] = useState(currentY);
  const [displayRotation, setDisplayRotation] = useState(directionToRotation[currentDirection]);

  // Get target values (from animation store if animating, otherwise from current position)
  const targetX = isProcessing ? (robotVisual?.targetX ?? currentX) : currentX;
  const targetY = isProcessing ? (robotVisual?.targetY ?? currentY) : currentY;
  const targetDirection = isProcessing ? (robotVisual?.targetDirection ?? currentDirection) : currentDirection;
  const targetRotation = directionToRotation[targetDirection];
  const isDestroyed = robotVisual?.isDestroyed ?? fallbackIsDestroyed;

  // Sync display position when not animating
  // This handles: initial load, reconnect, and animation completion
  const visualX = robotVisual?.x;
  const visualY = robotVisual?.y;
  const visualDirection = robotVisual?.direction;

  useEffect(() => {
    if (!isProcessing) {
      if (visualX !== undefined && visualY !== undefined && visualDirection !== undefined) {
        // Snap to the synced position from animation store
        setDisplayX(visualX);
        setDisplayY(visualY);
        setDisplayRotation(directionToRotation[visualDirection]);
      } else {
        // No robotVisual yet, use fallback
        setDisplayX(fallbackX);
        setDisplayY(fallbackY);
        setDisplayRotation(directionToRotation[fallbackDirection]);
      }
    }
  }, [isProcessing, visualX, visualY, visualDirection, fallbackX, fallbackY, fallbackDirection]);

  // Track whether animation is needed (to conditionally enable useTick)
  const needsAnimationRef = useRef(false);
  const needsPositionUpdate = Math.abs(targetX - displayX) > 0.001 || Math.abs(targetY - displayY) > 0.001;
  const needsRotationUpdate = Math.abs(shortestRotation(displayRotation, targetRotation)) > 0.001;
  needsAnimationRef.current = needsPositionUpdate || needsRotationUpdate;

  // Animate towards target - only enabled when animation is needed
  useTick((delta) => {
    const dx = targetX - displayX;
    const dy = targetY - displayY;
    const rotationDiff = shortestRotation(displayRotation, targetRotation);

    // Position interpolation
    if (Math.abs(dx) > 0.001 || Math.abs(dy) > 0.001) {
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (distance > 0.01) {
        const step = Math.min(LERP_SPEED * delta, 1);
        setDisplayX((prev) => prev + dx * step);
        setDisplayY((prev) => prev + dy * step);
      } else {
        setDisplayX(targetX);
        setDisplayY(targetY);
      }
    }

    // Rotation interpolation
    if (Math.abs(rotationDiff) > 0.001) {
      if (Math.abs(rotationDiff) > 0.01) {
        const step = Math.min(ROTATION_LERP_SPEED * delta, 1);
        setDisplayRotation((prev) => prev + rotationDiff * step);
      } else {
        setDisplayRotation(targetRotation);
      }
    }
  }, needsAnimationRef.current);

  if (isDestroyed) {
    return null;
  }

  const robotX = displayX * TILE_SIZE + TILE_SIZE / 2;
  const robotY = displayY * TILE_SIZE + TILE_SIZE / 2;
  const colorInt = parseInt(playerColor.slice(1), 16);

  return (
    <Container>
      <Sprite
        image={robotSprite}
        x={robotX}
        y={robotY}
        width={TILE_SIZE * 0.9}
        height={TILE_SIZE * 0.9}
        anchor={0.5}
        rotation={displayRotation}
        tint={colorInt}
      />
      {/* Player name label */}
      <Text
        text={playerName.slice(0, 8) + (isAI ? ' (AI)' : '')}
        x={robotX}
        y={displayY * TILE_SIZE + TILE_SIZE + 4}
        anchor={[0.5, 0]}
        style={nameTextStyle}
      />
    </Container>
  );
}
