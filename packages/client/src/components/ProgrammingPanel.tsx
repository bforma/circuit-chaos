import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { getCardLabel, REGISTERS_COUNT, getLockedRegisterCount } from '@circuit-chaos/shared';
import styles from './ProgrammingPanel.module.css';

export function ProgrammingPanel() {
  const { getCurrentPlayer, selectedCard, setSelectedCard } = useGameStore();
  const { programRegister, submitProgram, togglePowerDown } = useSocket();

  const player = getCurrentPlayer();
  if (!player) return null;

  const { hand, registers, isReady, robot } = player;
  const lockedCount = getLockedRegisterCount(robot.damage);
  const { isPoweredDown, willPowerDown, damage } = robot;

  const isRegisterLocked = (index: number) => {
    return index >= REGISTERS_COUNT - lockedCount;
  };

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
    if (isReady || !selectedCard || isRegisterLocked(index)) return;

    // Check if card is already in a register
    const existingIndex = registers.findIndex(r => r?.id === selectedCard.id);
    if (existingIndex !== -1 && existingIndex !== index) {
      // Move card to new register
      programRegister(existingIndex, null);
    }

    programRegister(index, selectedCard);
    setSelectedCard(null);
  };

  const handleAutoFill = () => {
    if (isReady) return;

    // Get cards not yet in registers
    const usedCardIds = new Set(registers.filter(r => r !== null).map(r => r!.id));
    const availableCards = hand.filter(card => !usedCardIds.has(card.id));

    // Fill empty unlocked registers
    let cardIndex = 0;
    for (let i = 0; i < REGISTERS_COUNT; i++) {
      if (!isRegisterLocked(i) && registers[i] === null && cardIndex < availableCards.length) {
        programRegister(i, availableCards[cardIndex]);
        cardIndex++;
      }
    }
  };

  const handleClearRegister = (index: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isReady || isRegisterLocked(index)) return;
    programRegister(index, null);
  };

  const handleRegisterDoubleClick = (index: number) => {
    if (isReady || isRegisterLocked(index)) return;
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
        {isPoweredDown ? '⚡ Powered Down - Healing...' :
         isReady ? 'Program Submitted!' : 'Program Your Robot'}
      </h3>

      {/* Power Down toggle */}
      {!isReady && !isPoweredDown && damage > 0 && (
        <div className={styles.powerDown}>
          <button
            className={`${styles.powerDownBtn} ${willPowerDown ? styles.active : ''}`}
            onClick={togglePowerDown}
          >
            {willPowerDown ? '⚡ Power Down Next Round' : '⚡ Announce Power Down'}
          </button>
          {willPowerDown && (
            <span className={styles.powerDownHint}>
              You will skip next round and heal all damage
            </span>
          )}
        </div>
      )}

      {isPoweredDown && (
        <div className={styles.poweredDownStatus}>
          Robot is powered down. All damage will be healed at end of round.
        </div>
      )}

      <div className={styles.registers}>
        <span className={styles.label}>Registers</span>
        <div className={styles.registerSlots}>
          {registers.map((card, index) => {
            const locked = isRegisterLocked(index);
            return (
              <div
                key={index}
                className={`${styles.register} ${card ? styles.filled : ''} ${locked ? styles.locked : ''} ${selectedCard && !isReady && !locked ? styles.clickable : ''}`}
                onClick={() => handleRegisterClick(index)}
                onDoubleClick={() => handleRegisterDoubleClick(index)}
              >
                {card ? (
                  <>
                    <span className={styles.cardType}>{getCardLabel(card.type)}</span>
                    <span className={styles.priority}>{card.priority}</span>
                    {!isReady && !locked && (
                      <button
                        className={styles.clearBtn}
                        onClick={(e) => handleClearRegister(index, e)}
                      >
                        ×
                      </button>
                    )}
                    {locked && <span className={styles.lockIcon}>🔒</span>}
                  </>
                ) : (
                  <span className={styles.registerNumber}>{index + 1}</span>
                )}
              </div>
            );
          })}
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
        <div className={styles.actions}>
          {!allRegistersFilled && (
            <button
              className="btn btn-secondary"
              onClick={handleAutoFill}
            >
              Auto-fill
            </button>
          )}
          <button
            className="btn btn-primary"
            onClick={handleSubmit}
            disabled={!allRegistersFilled}
          >
            Submit Program
          </button>
        </div>
      )}
    </div>
  );
}
