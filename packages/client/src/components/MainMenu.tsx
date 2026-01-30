import { useState, useEffect } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import styles from './MainMenu.module.css';

const MAX_NAME_LENGTH = 20;
const MIN_NAME_LENGTH = 2;

function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'Please enter your name';
  }
  if (trimmed.length < MIN_NAME_LENGTH) {
    return `Name must be at least ${MIN_NAME_LENGTH} characters`;
  }
  if (trimmed.length > MAX_NAME_LENGTH) {
    return `Name cannot exceed ${MAX_NAME_LENGTH} characters`;
  }
  // Check for at least one letter or number
  if (!/[a-zA-Z0-9]/.test(trimmed)) {
    return 'Name must contain at least one letter or number';
  }
  return null;
}

export function MainMenu() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const { gameIdToJoin, setGameIdToJoin, error, setError } = useGameStore();
  const { createGame, joinGame } = useSocket();

  // Auto-switch to join mode if there's a game ID in the URL
  useEffect(() => {
    if (gameIdToJoin) {
      setGameCode(gameIdToJoin);
      setMode('join');
    }
  }, [gameIdToJoin]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (error) setError(null);
  };

  const handleCreateGame = () => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    setError(null);
    createGame(name.trim());
  };

  const handleJoinGame = () => {
    const nameError = validateName(name);
    if (nameError) {
      setError(nameError);
      return;
    }
    if (!gameCode.trim()) {
      setError('Please enter a game code');
      return;
    }
    setError(null);
    joinGame(gameCode.toUpperCase(), name.trim());
  };

  const handleBack = () => {
    setMode('menu');
    setGameIdToJoin(null);
    setError(null);
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
          {error && <p className={styles.error}>{error}</p>}
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
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
          {error && <p className={styles.error}>{error}</p>}
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            maxLength={MAX_NAME_LENGTH}
            autoFocus
          />
          {!gameIdToJoin && (
            <input
              type="text"
              placeholder="Game code"
              value={gameCode}
              onChange={(e) => {
                setGameCode(e.target.value.toUpperCase());
                if (error) setError(null);
              }}
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
