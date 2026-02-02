import { useEffect, useCallback } from 'react';
import { SoundManager } from './SoundManager';

/**
 * Hook to enable sounds on first user interaction
 */
export function useSoundInit() {
  useEffect(() => {
    const enableAudio = () => {
      SoundManager.resume();
    };

    // Enable audio on first user interaction
    window.addEventListener('click', enableAudio, { once: true });
    window.addEventListener('keydown', enableAudio, { once: true });

    return () => {
      window.removeEventListener('click', enableAudio);
      window.removeEventListener('keydown', enableAudio);
    };
  }, []);
}

/**
 * Hook for UI sound effects
 */
export function useUISounds() {
  const playClick = useCallback(() => {
    SoundManager.play('click');
  }, []);

  const playCardPlace = useCallback(() => {
    SoundManager.play('cardPlace');
  }, []);

  const playCardRemove = useCallback(() => {
    SoundManager.play('cardRemove');
  }, []);

  const playSubmit = useCallback(() => {
    SoundManager.play('submit');
  }, []);

  const playError = useCallback(() => {
    SoundManager.play('error');
  }, []);

  return {
    playClick,
    playCardPlace,
    playCardRemove,
    playSubmit,
    playError,
  };
}

/**
 * Hook for game event sounds
 */
export function useGameSounds() {
  const playGameStart = useCallback(() => {
    SoundManager.play('gameStart');
  }, []);

  const playGameWin = useCallback(() => {
    SoundManager.play('gameWin');
  }, []);

  const playRegisterStart = useCallback(() => {
    SoundManager.play('registerStart');
  }, []);

  const playCheckpoint = useCallback(() => {
    SoundManager.play('checkpoint');
  }, []);

  const playEnergy = useCallback(() => {
    SoundManager.play('energy');
  }, []);

  return {
    playGameStart,
    playGameWin,
    playRegisterStart,
    playCheckpoint,
    playEnergy,
  };
}

/**
 * Hook for robot/animation sounds
 */
export function useRobotSounds() {
  const playRobotMove = useCallback(() => {
    SoundManager.play('robotMove');
  }, []);

  const playRobotRotate = useCallback(() => {
    SoundManager.play('robotRotate');
  }, []);

  const playRobotPushed = useCallback(() => {
    SoundManager.play('robotPushed');
  }, []);

  const playRobotDestroyed = useCallback(() => {
    SoundManager.play('robotDestroyed');
  }, []);

  const playConveyor = useCallback(() => {
    SoundManager.play('conveyor');
  }, []);

  const playGear = useCallback(() => {
    SoundManager.play('gear');
  }, []);

  const playLaserFire = useCallback(() => {
    SoundManager.play('laserFire');
  }, []);

  const playLaserHit = useCallback(() => {
    SoundManager.play('laserHit');
  }, []);

  return {
    playRobotMove,
    playRobotRotate,
    playRobotPushed,
    playRobotDestroyed,
    playConveyor,
    playGear,
    playLaserFire,
    playLaserHit,
  };
}

/**
 * Play sound for animation event type
 */
export function playAnimationEventSound(eventType: string) {
  switch (eventType) {
    case 'robot_move':
      SoundManager.play('robotMove');
      break;
    case 'robot_rotate':
      SoundManager.play('robotRotate');
      break;
    case 'robot_pushed':
      SoundManager.play('robotPushed');
      break;
    case 'robot_destroyed':
      SoundManager.play('robotDestroyed');
      break;
    case 'conveyor_move':
      SoundManager.play('conveyor');
      break;
    case 'gear_rotate':
      SoundManager.play('gear');
      break;
    case 'laser_fire':
      SoundManager.play('laserFire');
      break;
    case 'laser_hit':
      SoundManager.play('laserHit');
      break;
    case 'checkpoint_reached':
      SoundManager.play('checkpoint');
      break;
    case 'energy_gained':
      SoundManager.play('energy');
      break;
    case 'register_start':
      SoundManager.play('registerStart');
      break;
  }
}

/**
 * Sound settings hook
 */
export function useSoundSettings() {
  const setVolume = useCallback((volume: number) => {
    SoundManager.setVolume(volume);
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    SoundManager.setEnabled(enabled);
  }, []);

  const getVolume = useCallback(() => {
    return SoundManager.getVolume();
  }, []);

  const isEnabled = useCallback(() => {
    return SoundManager.isEnabled();
  }, []);

  return {
    setVolume,
    setEnabled,
    getVolume,
    isEnabled,
  };
}
