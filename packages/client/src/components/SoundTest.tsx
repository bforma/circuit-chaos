import { SoundManager } from '../audio/SoundManager';
import { useSoundSettings } from '../audio/useSounds';
import { useState } from 'react';
import { useGameStore } from '../stores/gameStore';

const soundCategories = [
  {
    name: 'Robot Sounds',
    sounds: [
      { id: 'robotMove', label: 'Robot Move', desc: 'Robot beweegt 1 tegel' },
      { id: 'robotRotate', label: 'Robot Rotate', desc: 'Robot draait' },
      { id: 'robotPushed', label: 'Robot Pushed', desc: 'Robot wordt geduwd' },
      { id: 'robotDestroyed', label: 'Robot Destroyed', desc: 'Robot vernietigd' },
    ],
  },
  {
    name: 'Board Elements',
    sounds: [
      { id: 'conveyor', label: 'Conveyor', desc: 'Lopende band' },
      { id: 'gear', label: 'Gear', desc: 'Tandwiel draait' },
      { id: 'laserFire', label: 'Laser Fire', desc: 'Laser vuurt' },
      { id: 'laserHit', label: 'Laser Hit', desc: 'Laser raakt robot' },
    ],
  },
  {
    name: 'Achievements',
    sounds: [
      { id: 'checkpoint', label: 'Checkpoint', desc: 'Checkpoint bereikt' },
      { id: 'energy', label: 'Energy', desc: 'Energie opgehaald' },
      { id: 'gameWin', label: 'Game Win', desc: 'Spel gewonnen' },
    ],
  },
  {
    name: 'UI Sounds',
    sounds: [
      { id: 'cardPlace', label: 'Card Place', desc: 'Kaart plaatsen' },
      { id: 'cardRemove', label: 'Card Remove', desc: 'Kaart verwijderen' },
      { id: 'submit', label: 'Submit', desc: 'Programma indienen' },
      { id: 'gameStart', label: 'Game Start', desc: 'Spel starten' },
      { id: 'registerStart', label: 'Register Start', desc: 'Register begint' },
      { id: 'click', label: 'Click', desc: 'Knop klik' },
      { id: 'error', label: 'Error', desc: 'Foutmelding' },
    ],
  },
];

export function SoundTest() {
  const { setVolume, setEnabled, getVolume, isEnabled } = useSoundSettings();
  const [volume, setVolumeState] = useState(getVolume());
  const [enabled, setEnabledState] = useState(isEnabled());
  const setScreen = useGameStore((state) => state.setScreen);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolumeState(newVolume);
    setVolume(newVolume);
  };

  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEnabled = e.target.checked;
    setEnabledState(newEnabled);
    setEnabled(newEnabled);
  };

  const playSound = (soundId: string) => {
    SoundManager.play(soundId as any);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Sound Test - Circuit Chaos</h1>

      <div style={styles.controls}>
        <label style={styles.controlLabel}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={handleEnabledChange}
            style={styles.checkbox}
          />
          Sound Enabled
        </label>

        <label style={styles.controlLabel}>
          Volume: {Math.round(volume * 100)}%
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={volume}
            onChange={handleVolumeChange}
            style={styles.slider}
          />
        </label>
      </div>

      {soundCategories.map((category) => (
        <div key={category.name} style={styles.category}>
          <h2 style={styles.categoryTitle}>{category.name}</h2>
          <div style={styles.soundGrid}>
            {category.sounds.map((sound) => (
              <button
                key={sound.id}
                onClick={() => playSound(sound.id)}
                style={styles.soundButton}
              >
                <span style={styles.soundLabel}>{sound.label}</span>
                <span style={styles.soundDesc}>{sound.desc}</span>
              </button>
            ))}
          </div>
        </div>
      ))}

      <div style={styles.note}>
        <p>Click any button to play the synthesized sound.</p>
        <p>These are placeholder sounds generated with Web Audio API.</p>
        <p>They can be replaced with real audio files later.</p>
      </div>

      <button
        onClick={() => setScreen('menu')}
        style={styles.backButton}
      >
        Back to Menu
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    padding: '40px',
    maxWidth: '800px',
    margin: '0 auto',
    fontFamily: 'system-ui, sans-serif',
  },
  title: {
    color: '#fff',
    marginBottom: '20px',
    textAlign: 'center',
  },
  controls: {
    display: 'flex',
    gap: '30px',
    justifyContent: 'center',
    marginBottom: '30px',
    padding: '20px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
  },
  controlLabel: {
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  checkbox: {
    width: '20px',
    height: '20px',
  },
  slider: {
    width: '150px',
    marginLeft: '10px',
  },
  category: {
    marginBottom: '30px',
  },
  categoryTitle: {
    color: '#667eea',
    marginBottom: '15px',
    borderBottom: '1px solid #667eea',
    paddingBottom: '5px',
  },
  soundGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '10px',
  },
  soundButton: {
    padding: '15px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.1s, box-shadow 0.1s',
  },
  soundLabel: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  soundDesc: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: '11px',
    marginTop: '4px',
  },
  note: {
    marginTop: '30px',
    padding: '20px',
    background: 'rgba(255,255,255,0.05)',
    borderRadius: '8px',
    color: '#999',
    textAlign: 'center',
  },
  backButton: {
    marginTop: '20px',
    padding: '10px 30px',
    background: '#333',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    display: 'block',
    margin: '20px auto 0',
  },
};
