import { create } from 'zustand';
import type {
  AnimationEvent,
  Direction,
  RobotMoveEvent,
  RobotRotateEvent,
  RobotPushedEvent,
  RobotDestroyedEvent,
  ConveyorMoveEvent,
  GearRotateEvent,
  LaserFireEvent,
} from '@circuit-chaos/shared';
import { useGameStore } from './gameStore';

// Robot visual state (interpolated position and rotation)
export interface RobotVisual {
  playerId: string;
  x: number;
  y: number;
  direction: Direction;
  targetX: number;
  targetY: number;
  targetDirection: Direction;
  isAnimating: boolean;
  isDestroyed: boolean;
}

// Laser beam for rendering
export interface LaserBeam {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  direction: Direction;
  strength: number;
  expiresAt: number;
}

// Module-level set to track processed events (avoids race conditions with state updates)
let processedEventIndices = new Set<number>();

interface AnimationStore {
  // Robot visuals (keyed by playerId)
  robotVisuals: Map<string, RobotVisual>;

  // Event queue
  eventQueue: AnimationEvent[];
  isProcessingQueue: boolean;
  queueStartTime: number;

  // Laser beams currently visible
  laserBeams: LaserBeam[];

  // Actions
  setRobotVisuals: (visuals: Map<string, RobotVisual>) => void;
  initializeRobotVisuals: (players: Array<{
    id: string;
    robot: { position: { x: number; y: number }; direction: Direction; isDestroyed: boolean };
  }>) => void;
  queueEvents: (events: AnimationEvent[]) => void;
  processEvents: () => void;
  updateRobotPosition: (playerId: string, x: number, y: number, direction: Direction) => void;
  setRobotAnimating: (playerId: string, isAnimating: boolean) => void;
  setRobotDestroyed: (playerId: string, isDestroyed: boolean) => void;
  addLaserBeam: (beam: LaserBeam) => void;
  clearExpiredLasers: () => void;
  getRobotVisual: (playerId: string) => RobotVisual | undefined;
  isAnimating: () => boolean;
  reset: () => void;
}

export const useAnimationStore = create<AnimationStore>((set, get) => ({
  robotVisuals: new Map(),
  eventQueue: [],
  isProcessingQueue: false,
  queueStartTime: 0,
  laserBeams: [],

  setRobotVisuals: (visuals) => set({ robotVisuals: visuals }),

  initializeRobotVisuals: (players) => {
    const visuals = new Map<string, RobotVisual>();
    for (const player of players) {
      visuals.set(player.id, {
        playerId: player.id,
        x: player.robot.position.x,
        y: player.robot.position.y,
        direction: player.robot.direction,
        targetX: player.robot.position.x,
        targetY: player.robot.position.y,
        targetDirection: player.robot.direction,
        isAnimating: false,
        isDestroyed: player.robot.isDestroyed,
      });
    }
    set({ robotVisuals: visuals });
  },

  queueEvents: (events) => {
    // Reset module-level tracking
    processedEventIndices = new Set();

    set({
      eventQueue: events,
      queueStartTime: performance.now(),
      isProcessingQueue: true,
    });
    get().processEvents();
  },

  processEvents: () => {
    const { eventQueue, queueStartTime, isProcessingQueue } = get();
    if (!isProcessingQueue || eventQueue.length === 0) return;

    const now = performance.now();
    const elapsedTime = now - queueStartTime;

    // Process events up to the current time (only if not already processed)
    for (let i = 0; i < eventQueue.length; i++) {
      const event = eventQueue[i];
      if (event.timestamp <= elapsedTime && !processedEventIndices.has(i)) {
        // Mark as processed before handling (module-level, no race condition)
        processedEventIndices.add(i);
        handleAnimationEvent(event, get, set);
      }
    }

    // Check if all events have been processed
    const lastEvent = eventQueue[eventQueue.length - 1];
    if (lastEvent && elapsedTime >= lastEvent.timestamp + 500) {
      // Animation complete - clean up and sync final positions
      const { robotVisuals } = get();
      const syncedVisuals = new Map<string, RobotVisual>();

      // Sync current position to target position for all robots
      for (const [id, visual] of robotVisuals) {
        syncedVisuals.set(id, {
          ...visual,
          x: visual.targetX,
          y: visual.targetY,
          direction: visual.targetDirection,
          isAnimating: false,
        });
      }

      // Reset module-level tracking
      processedEventIndices = new Set();

      set({
        isProcessingQueue: false,
        eventQueue: [],
        robotVisuals: syncedVisuals,
        laserBeams: [], // Clear all lasers when animation completes
      });
    }
  },

  updateRobotPosition: (playerId, x, y, direction) => {
    const { robotVisuals } = get();
    const visual = robotVisuals.get(playerId);
    if (visual) {
      const updated = new Map(robotVisuals);
      updated.set(playerId, {
        ...visual,
        targetX: x,
        targetY: y,
        targetDirection: direction,
        isAnimating: true,
      });
      set({ robotVisuals: updated });
    }
  },

  setRobotAnimating: (playerId, isAnimating) => {
    const { robotVisuals } = get();
    const visual = robotVisuals.get(playerId);
    if (visual) {
      const updated = new Map(robotVisuals);
      updated.set(playerId, { ...visual, isAnimating });
      set({ robotVisuals: updated });
    }
  },

  setRobotDestroyed: (playerId, isDestroyed) => {
    const { robotVisuals } = get();
    const visual = robotVisuals.get(playerId);
    if (visual) {
      const updated = new Map(robotVisuals);
      updated.set(playerId, { ...visual, isDestroyed });
      set({ robotVisuals: updated });
    }
  },

  addLaserBeam: (beam) => {
    set((state) => ({
      laserBeams: [...state.laserBeams, beam],
    }));
  },

  clearExpiredLasers: () => {
    const now = performance.now();
    set((state) => ({
      laserBeams: state.laserBeams.filter((beam) => beam.expiresAt > now),
    }));
  },

  getRobotVisual: (playerId) => get().robotVisuals.get(playerId),

  isAnimating: () => get().isProcessingQueue,

  reset: () => {
    processedEventIndices = new Set();
    set({
      robotVisuals: new Map(),
      eventQueue: [],
      isProcessingQueue: false,
      queueStartTime: 0,
      laserBeams: [],
    });
  },
}));

// Handle individual animation events
function handleAnimationEvent(
  event: AnimationEvent,
  get: () => AnimationStore,
  set: (state: Partial<AnimationStore> | ((state: AnimationStore) => Partial<AnimationStore>)) => void
) {
  const store = get();

  // Add log entry for this event (at the correct time)
  useGameStore.getState().addLogEntryFromEvent(event);

  switch (event.type) {
    case 'player_card': {
      // Card display removed - only log entry is created above
      break;
    }

    case 'robot_move': {
      const moveEvent = event as RobotMoveEvent;
      store.updateRobotPosition(
        moveEvent.playerId,
        moveEvent.toX,
        moveEvent.toY,
        moveEvent.direction
      );
      break;
    }

    case 'robot_rotate': {
      const rotateEvent = event as RobotRotateEvent;
      const visual = store.getRobotVisual(rotateEvent.playerId);
      if (visual) {
        store.updateRobotPosition(
          rotateEvent.playerId,
          visual.targetX,
          visual.targetY,
          rotateEvent.toDirection
        );
      }
      break;
    }

    case 'robot_pushed': {
      const pushEvent = event as RobotPushedEvent;
      store.updateRobotPosition(
        pushEvent.playerId,
        pushEvent.toX,
        pushEvent.toY,
        pushEvent.direction
      );
      break;
    }

    case 'robot_destroyed': {
      const destroyEvent = event as RobotDestroyedEvent;
      store.setRobotDestroyed(destroyEvent.playerId, true);
      break;
    }

    case 'conveyor_move': {
      const conveyorEvent = event as ConveyorMoveEvent;
      for (const movement of conveyorEvent.movements) {
        const visual = store.getRobotVisual(movement.playerId);
        if (visual) {
          // Calculate new direction if rotation is specified
          let newDirection = visual.targetDirection;
          if (movement.rotation) {
            newDirection = rotateDirectionLocal(visual.targetDirection, movement.rotation);
          }
          store.updateRobotPosition(
            movement.playerId,
            movement.toX,
            movement.toY,
            newDirection
          );
        }
      }
      break;
    }

    case 'gear_rotate': {
      const gearEvent = event as GearRotateEvent;
      for (const rotation of gearEvent.rotations) {
        store.updateRobotPosition(
          rotation.playerId,
          store.getRobotVisual(rotation.playerId)?.targetX ?? 0,
          store.getRobotVisual(rotation.playerId)?.targetY ?? 0,
          rotation.toDirection
        );
      }
      break;
    }

    case 'laser_fire': {
      const laserEvent = event as LaserFireEvent;
      const now = performance.now();
      for (const laser of laserEvent.lasers) {
        store.addLaserBeam({
          id: crypto.randomUUID(),
          startX: laser.startX,
          startY: laser.startY,
          endX: laser.endX,
          endY: laser.endY,
          direction: laser.direction,
          strength: laser.strength,
          expiresAt: now + 400,
        });
      }
      break;
    }

    case 'laser_hit':
    case 'checkpoint_reached':
    case 'energy_gained':
    case 'register_start':
    case 'register_end':
      // Visual effects handled above or in laser_fire, log entry already added
      break;
  }
}

// Local rotation helper
function rotateDirectionLocal(dir: Direction, rotation: 'cw' | 'ccw'): Direction {
  const directions: Direction[] = ['north', 'east', 'south', 'west'];
  const index = directions.indexOf(dir);
  if (rotation === 'cw') {
    return directions[(index + 1) % 4];
  } else {
    return directions[(index + 3) % 4];
  }
}
