import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import styles from './GameLog.module.css';

// Format timestamp as HH:MM:SS
function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('nl-NL', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function GameLog() {
  const gameLog = useGameStore((state) => state.gameLog);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const [recentIds, setRecentIds] = useState<Set<string>>(new Set());

  // Track recent entries for highlight effect
  useEffect(() => {
    if (gameLog.length === 0) return;

    const latestEntry = gameLog[gameLog.length - 1];
    if (!latestEntry) return;

    // Add to recent set
    setRecentIds((prev) => new Set([...prev, latestEntry.id]));

    // Remove highlight after animation
    const timer = setTimeout(() => {
      setRecentIds((prev) => {
        const next = new Set(prev);
        next.delete(latestEntry.id);
        return next;
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, [gameLog.length]);

  // Auto-scroll to bottom when new entries are added
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [gameLog]);

  const getEntryIcon = (type: string): string => {
    switch (type) {
      case 'card_played':
        return '🎴';
      case 'robot_move':
        return '→';
      case 'robot_rotate':
        return '↻';
      case 'robot_pushed':
        return '💨';
      case 'robot_destroyed':
        return '💥';
      case 'conveyor_activated':
        return '⬆️';
      case 'gear_activated':
        return '⚙️';
      case 'laser_hit':
        return '🔴';
      case 'checkpoint_reached':
        return '🏁';
      case 'energy_gained':
        return '⚡';
      case 'register_start':
        return '▶️';
      case 'register_end':
        return '⏹️';
      default:
        return '•';
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <span className={styles.title}>Game Log</span>
      </div>

      <div className={styles.logContainer} ref={logContainerRef}>
        {gameLog.length === 0 ? (
          <div className={styles.emptyState}>No events yet</div>
        ) : (
          gameLog.map((entry) => (
            <div
              key={entry.id}
              className={`${styles.entry} ${styles[entry.type] || ''} ${recentIds.has(entry.id) ? styles.recent : ''}`}
            >
              <span className={styles.timestamp}>{formatTime(entry.timestamp)}</span>
              <span className={styles.icon}>{getEntryIcon(entry.type)}</span>
              <span
                className={styles.message}
                style={entry.playerColor ? { borderLeftColor: entry.playerColor } : undefined}
              >
                {entry.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
