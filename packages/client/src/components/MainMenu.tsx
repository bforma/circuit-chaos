import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import styles from './MainMenu.module.css';

export function MainMenu() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const { gameIdToJoin, setGameIdToJoin } = useGameStore();
  const { createGame, joinGame } = useSocket();

  // Auto-switch to join mode if there's a game ID in the URL
  useEffect(() => {
    if (gameIdToJoin) {
      setGameCode(gameIdToJoin);
      setMode('join');
    }
  }, [gameIdToJoin]);

  const handleCreateGame = () => {
    if (!name.trim()) return;
    createGame(name);
  };

  const handleJoinGame = () => {
    if (!name.trim() || !gameCode.trim()) return;
    joinGame(gameCode.toUpperCase(), name);
  };

  const handleBack = () => {
    setMode('menu');
    setGameIdToJoin(null);
    // Clear URL hash if we're going back to menu
    window.history.replaceState(null, '', window.location.pathname);
  };

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Circuit Chaos</h1>
      <p className={styles.subtitle}>Program your robot. Survive the factory. Win the race.</p>

      {mode === 'menu' && (
        <div className={styles.buttons}>
          <button className="btn btn-primary" onClick={() => setMode('create')}>
            Create Game
          </button>
          <button className="btn btn-secondary" onClick={() => setMode('join')}>
            Join Game
          </button>
        </div>
      )}

      {mode === 'create' && (
        <div className={styles.form}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          <div className={styles.buttons}>
            <button className="btn btn-primary" onClick={handleCreateGame}>
              Create
            </button>
            <button className="btn btn-secondary" onClick={handleBack}>
              Back
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className={styles.form}>
          {gameIdToJoin && (
            <p className={styles.joinPrompt}>
              Enter your name to join game <strong>{gameIdToJoin}</strong>
            </p>
          )}
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoFocus
          />
          {!gameIdToJoin && (
            <input
              type="text"
              placeholder="Game code"
              value={gameCode}
              onChange={(e) => setGameCode(e.target.value.toUpperCase())}
              maxLength={6}
            />
          )}
          <div className={styles.buttons}>
            <button className="btn btn-primary" onClick={handleJoinGame}>
              Join
            </button>
            <button className="btn btn-secondary" onClick={handleBack}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
