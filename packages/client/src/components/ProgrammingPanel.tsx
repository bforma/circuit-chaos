import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { getCardLabel, REGISTERS_COUNT } from '@circuit-chaos/shared';
import styles from './ProgrammingPanel.module.css';

export function ProgrammingPanel() {
  const { getCurrentPlayer, selectedCard, setSelectedCard } = useGameStore();
  const { programRegister, submitProgram } = useSocket();

  const player = getCurrentPlayer();
  if (!player) return null;

  const { hand, registers, isReady } = player;

  const handleCardClick = (card: typeof hand[0]) => {
    if (isReady) return;
    if (selectedCard?.id === card.id) {
      setSelectedCard(null);
    } else {
      setSelectedCard(card);
    }
  };

  const handleCardDoubleClick = (card: typeof hand[0]) => {
    if (isReady) return;

    // Find first empty register
    const emptyIndex = registers.findIndex(r => r === null);
    if (emptyIndex === -1) return;

    // If card is already in a register, remove it first
    const existingIndex = registers.findIndex(r => r?.id === card.id);
    if (existingIndex !== -1) {
      programRegister(existingIndex, null);
    }

    programRegister(emptyIndex, card);
    setSelectedCard(null);
  };

  const handleRegisterClick = (index: number) => {
    if (isReady || !selectedCard) return;

    // Check if card is already in a register
    const existingIndex = registers.findIndex(r => r?.id === selectedCard.id);
    if (existingIndex !== -1 && existingIndex !== index) {
      // Move card to new register
      programRegister(existingIndex, null);
    }

    programRegister(index, selectedCard);
    setSelectedCard(null);
  };

  const handleClearRegister = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isReady) return;
    programRegister(index, null);
  };

  const handleRegisterDoubleClick = (index: number) => {
    if (isReady) return;
    if (registers[index]) {
      programRegister(index, null);
    }
  };

  const handleSubmit = () => {
    if (registers.every(r => r !== null)) {
      submitProgram();
    }
  };

  const allRegistersFilled = registers.every(r => r !== null);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>
        {isReady ? 'Program Submitted!' : 'Program Your Robot'}
      </h3>

      <div className={styles.registers}>
        <span className={styles.label}>Registers</span>
        <div className={styles.registerSlots}>
          {registers.map((card, index) => (
            <div
              key={index}
              className={`${styles.register} ${card ? styles.filled : ''} ${selectedCard && !isReady ? styles.clickable : ''}`}
              onClick={() => handleRegisterClick(index)}
              onDoubleClick={() => handleRegisterDoubleClick(index)}
            >
              {card ? (
                <>
                  <span className={styles.cardType}>{getCardLabel(card.type)}</span>
                  <span className={styles.priority}>{card.priority}</span>
                  {!isReady && (
                    <button
                      className={styles.clearBtn}
                      onClick={(e) => handleClearRegister(index, e)}
                    >
                      ×
                    </button>
                  )}
                </>
              ) : (
                <span className={styles.registerNumber}>{index + 1}</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className={styles.hand}>
        <span className={styles.label}>Your Cards</span>
        <div className={styles.cards}>
          {hand.map((card) => {
            const isInRegister = registers.some(r => r?.id === card.id);
            return (
              <div
                key={card.id}
                className={`
                  ${styles.card}
                  ${selectedCard?.id === card.id ? styles.selected : ''}
                  ${isInRegister ? styles.used : ''}
                  ${isReady ? styles.disabled : ''}
                `}
                onClick={() => handleCardClick(card)}
                onDoubleClick={() => handleCardDoubleClick(card)}
              >
                <span className={styles.cardType}>{getCardLabel(card.type)}</span>
                <span className={styles.priority}>{card.priority}</span>
              </div>
            );
          })}
        </div>
      </div>

      {!isReady && (
        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!allRegistersFilled}
        >
          {allRegistersFilled ? 'Submit Program' : 'Fill all registers'}
        </button>
      )}
    </div>
  );
}
