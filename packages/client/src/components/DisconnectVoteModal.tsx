import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import type { DisconnectVoteOption } from '@circuit-chaos/shared';
import styles from './DisconnectVoteModal.module.css';

export function DisconnectVoteModal() {
  const { gameState, playerId } = useGameStore();
  const { voteDisconnect } = useSocket();
  const [timeLeft, setTimeLeft] = useState(30);

  const vote = gameState?.disconnectVote;

  // Update countdown timer
  useEffect(() => {
    if (!vote) return;

    const updateTimer = () => {
      setTimeLeft(Math.max(0, Math.ceil((vote.endsAt - Date.now()) / 1000)));
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [vote?.endsAt]);

  if (!vote) return null;

  // Don't show modal to the disconnected player (they can't vote anyway)
  if (vote.playerId === playerId) return null;

  const myVote = vote.votes[playerId || ''];

  const connectedPlayers = gameState?.players.filter(
    p => p.isConnected && p.id !== vote.playerId
  ) || [];
  const voteCount = Object.keys(vote.votes).length;

  const handleVote = (option: DisconnectVoteOption) => {
    voteDisconnect(option);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2 className={styles.title}>Player Disconnected</h2>
        <p className={styles.description}>
          <strong>{vote.playerName}</strong> has been disconnected for 30 seconds.
          What should happen?
        </p>

        <div className={styles.timer}>
          Time remaining: <span>{timeLeft}s</span>
        </div>

        <div className={styles.options}>
          <button
            className={`${styles.option} ${myVote === 'remove' ? styles.selected : ''}`}
            onClick={() => handleVote('remove')}
            disabled={!!myVote}
          >
            <span className={styles.optionTitle}>Remove from game</span>
            <span className={styles.optionDesc}>
              Player will be removed and game continues
            </span>
          </button>

          <button
            className={`${styles.option} ${myVote === 'random-cards' ? styles.selected : ''}`}
            onClick={() => handleVote('random-cards')}
            disabled={!!myVote}
          >
            <span className={styles.optionTitle}>Play random cards</span>
            <span className={styles.optionDesc}>
              Robot plays with random programming
            </span>
          </button>

          <button
            className={`${styles.option} ${myVote === 'stop-game' ? styles.selected : ''}`}
            onClick={() => handleVote('stop-game')}
            disabled={!!myVote}
          >
            <span className={styles.optionTitle}>Stop the game</span>
            <span className={styles.optionDesc}>
              End the game for everyone
            </span>
          </button>
        </div>

        <div className={styles.voteCount}>
          Votes: {voteCount} / {connectedPlayers.length}
        </div>

        {myVote && (
          <p className={styles.voted}>
            You voted: <strong>{getVoteLabel(myVote)}</strong>
          </p>
        )}
      </div>
    </div>
  );
}

function getVoteLabel(vote: DisconnectVoteOption): string {
  switch (vote) {
    case 'remove': return 'Remove from game';
    case 'random-cards': return 'Play random cards';
    case 'stop-game': return 'Stop the game';
  }
}
