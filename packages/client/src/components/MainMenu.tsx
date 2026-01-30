import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import styles from './MainMenu.module.css';

export function MainMenu() {
  const [name, setName] = useState('');
  const [gameCode, setGameCode] = useState('');
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');

  const { playerName, setPlayerName, setScreen } = useGameStore();
  const { createGame, joinGame } = useSocket();

  const handleCreateGame = () => {
    if (!name.trim()) return;
    setPlayerName(name);
    createGame(name);
  };

  const handleJoinGame = () => {
    if (!name.trim() || !gameCode.trim()) return;
    setPlayerName(name);
    joinGame(gameCode.toUpperCase(), name);
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
          />
          <div className={styles.buttons}>
            <button className="btn btn-primary" onClick={handleCreateGame}>
              Create
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('menu')}>
              Back
            </button>
          </div>
        </div>
      )}

      {mode === 'join' && (
        <div className={styles.form}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
          />
          <input
            type="text"
            placeholder="Game code"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value.toUpperCase())}
            maxLength={6}
          />
          <div className={styles.buttons}>
            <button className="btn btn-primary" onClick={handleJoinGame}>
              Join
            </button>
            <button className="btn btn-secondary" onClick={() => setMode('menu')}>
              Back
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
