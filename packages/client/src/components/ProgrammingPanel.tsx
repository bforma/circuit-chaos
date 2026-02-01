import { useGameStore } from '../stores/gameStore';
import { useSocket } from '../hooks/useSocket';
import { getCardLabel, getCardIcon, REGISTERS_COUNT, isDamageCard } from '@circuit-chaos/shared';
import styles from './ProgrammingPanel.module.css';

export function ProgrammingPanel() {
  const { gameState, getCurrentPlayer, selectedCard, setSelectedCard, setHoveredCard } = useGameStore();
  const { programRegister, submitProgram, shutdownRobot } = useSocket();

  const cardPreviewEnabled = gameState?.cardPreviewEnabled ?? false;

  const player = getCurrentPlayer();
  if (!player) return null;

  const { hand, registers, haywireRegisters, isReady, robot } = player;

  // Count damage cards in hand
  const damageCardsInHand = hand.filter(card => isDamageCard(card.type)).length;

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
    setHoveredCard(null);
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
    setHoveredCard(null);
  };

  const handleAutoFill = () => {
    if (isReady) return;

    // Get cards not yet in registers
    const usedCardIds = new Set(registers.filter(r => r !== null).map(r => r!.id));
    const availableCards = hand.filter(card => !usedCardIds.has(card.id));

    // Fill empty registers
    let cardIndex = 0;
    for (let i = 0; i < REGISTERS_COUNT; i++) {
      if (registers[i] === null && cardIndex < availableCards.length) {
        programRegister(i, availableCards[cardIndex]);
        cardIndex++;
      }
    }
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
          {registers.map((card, index) => {
            const haywireCard = haywireRegisters?.[index];
            return (
              <div key={index} className={styles.registerWrapper}>
                <div
                  className={`${styles.register} ${card ? styles.filled : ''} ${selectedCard && !isReady ? styles.clickable : ''} ${card && isDamageCard(card.type) ? styles.damageCard : ''}`}
                  onClick={() => handleRegisterClick(index)}
                  onDoubleClick={() => handleRegisterDoubleClick(index)}
                >
                  {card ? (
                    <>
                      <span className={styles.cardIcon}>{getCardIcon(card.type)}</span>
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
                {haywireCard && (
                  <div className={styles.haywireIndicator} title="Haywire card (executes next round)">
                    ⚠️
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className={styles.hand}>
        <span className={styles.label}>
          Your Cards
          {damageCardsInHand > 0 && (
            <span className={styles.damageCount}> ({damageCardsInHand} damage)</span>
          )}
        </span>
        <div className={styles.cards}>
          {hand.map((card) => {
            const isInRegister = registers.some(r => r?.id === card.id);
            const isDamage = isDamageCard(card.type);
            return (
              <div
                key={card.id}
                className={`
                  ${styles.card}
                  ${selectedCard?.id === card.id ? styles.selected : ''}
                  ${isInRegister ? styles.used : ''}
                  ${isReady ? styles.disabled : ''}
                  ${isDamage ? styles.damageCard : ''}
                `}
                onClick={() => handleCardClick(card)}
                onDoubleClick={() => handleCardDoubleClick(card)}
                onMouseEnter={() => cardPreviewEnabled && !isInRegister && !isReady && setHoveredCard(card)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <span className={styles.cardIcon}>{getCardIcon(card.type)}</span>
                <span className={styles.cardType}>{getCardLabel(card.type)}</span>
                {!isDamage && <span className={styles.priority}>{card.priority}</span>}
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

      {isReady && damageCardsInHand > 0 && !robot.isPoweredDown && (
        <div className={styles.shutdownSection}>
          <p className={styles.shutdownHint}>
            You have {damageCardsInHand} damage card{damageCardsInHand > 1 ? 's' : ''} in hand. Shutdown to clear all damage and skip this round.
          </p>
          <button
            className="btn btn-warning"
            onClick={shutdownRobot}
          >
            Shutdown Robot
          </button>
        </div>
      )}

      {robot.isPoweredDown && (
        <div className={styles.shutdownNotice}>
          Robot is shut down this round. All damage cleared.
        </div>
      )}
    </div>
  );
}
