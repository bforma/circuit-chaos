import type {
  GameState,
  Player,
  Card,
  AIDifficulty,
} from '@circuit-chaos/shared';
import { REGISTERS_COUNT } from '@circuit-chaos/shared';
import {
  simulateCardSequence,
  evaluatePosition,
} from './pathfinding';

interface CardSelection {
  registers: (Card | null)[];
}

/**
 * Make AI decision for card selection
 * Returns the cards to place in registers
 */
export function makeAIDecision(
  state: GameState,
  player: Player
): CardSelection {
  const difficulty = player.aiDifficulty ?? 'medium';

  switch (difficulty) {
    case 'easy':
      return makeEasyDecision(state, player);
    case 'medium':
      return makeMediumDecision(state, player);
    case 'hard':
      return makeHardDecision(state, player);
    default:
      return makeMediumDecision(state, player);
  }
}

/**
 * Easy AI: Mostly random with slight preference for movement
 */
function makeEasyDecision(state: GameState, player: Player): CardSelection {
  const availableCards = [...player.hand];
  const registers: (Card | null)[] = [null, null, null, null, null];

  // Fill all 5 registers (2023 rules: no locked registers)
  for (let i = 0; i < REGISTERS_COUNT; i++) {
    if (availableCards.length === 0) break;

    // 40% pure random, 60% prefer movement cards
    if (Math.random() < 0.4) {
      const randomIndex = Math.floor(Math.random() * availableCards.length);
      registers[i] = availableCards.splice(randomIndex, 1)[0];
    } else {
      // Sort by movement preference
      const sorted = [...availableCards].sort((a, b) => {
        const moveScore = (card: Card) => {
          if (card.type.startsWith('move')) return 2;
          if (card.type === 'backup') return 1;
          return 0;
        };
        return moveScore(b) - moveScore(a);
      });

      const card = sorted[0];
      const index = availableCards.indexOf(card);
      registers[i] = availableCards.splice(index, 1)[0];
    }
  }

  return {
    registers,
  };
}

/**
 * Medium AI: Greedy pathfinding with 3-move lookahead
 */
function makeMediumDecision(state: GameState, player: Player): CardSelection {
  const availableCards = [...player.hand];
  const registers: (Card | null)[] = [null, null, null, null, null];

  // Greedy approach: pick best card for each register
  for (let i = 0; i < REGISTERS_COUNT; i++) {
    if (availableCards.length === 0) break;

    let bestCard: Card | null = null;
    let bestScore = -Infinity;

    for (const card of availableCards) {
      // Create test registers with this card
      const testRegisters = [...registers];
      testRegisters[i] = card;

      // Simulate up to 3 moves ahead
      const lookahead = Math.min(3, REGISTERS_COUNT - i);
      const cardsToSimulate = testRegisters.slice(0, i + lookahead);

      const result = simulateCardSequence(state, player, cardsToSimulate);
      const score = evaluatePosition(state, result, player);

      if (score > bestScore) {
        bestScore = score;
        bestCard = card;
      }
    }

    // 15% chance to pick second-best option
    if (bestCard && Math.random() < 0.15 && availableCards.length > 1) {
      const otherCards = availableCards.filter(c => c.id !== bestCard!.id);
      if (otherCards.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherCards.length);
        bestCard = otherCards[randomIndex];
      }
    }

    if (bestCard) {
      const index = availableCards.findIndex(c => c.id === bestCard!.id);
      registers[i] = availableCards.splice(index, 1)[0];
    }
  }

  return {
    registers,
  };
}

/**
 * Hard AI: Full lookahead with optimal decision making
 */
function makeHardDecision(state: GameState, player: Player): CardSelection {
  const availableCards = [...player.hand];

  // Find best combination of cards for all 5 registers
  const bestSequence = findBestCardSequence(
    state,
    player,
    availableCards,
    REGISTERS_COUNT
  );

  return {
    registers: bestSequence,
  };
}

/**
 * Find the best sequence of cards using exhaustive search
 * (with pruning for performance)
 */
function findBestCardSequence(
  state: GameState,
  player: Player,
  availableCards: Card[],
  count: number
): (Card | null)[] {
  if (count === 0 || availableCards.length === 0) {
    return [];
  }

  // For performance, limit search depth
  const maxCombinations = 1000;
  let combinationsChecked = 0;

  let bestSequence: Card[] = [];
  let bestScore = -Infinity;

  // Generate permutations (limited)
  function* permutations(cards: Card[], length: number): Generator<Card[]> {
    if (length === 0) {
      yield [];
      return;
    }

    for (let i = 0; i < cards.length; i++) {
      const remaining = [...cards.slice(0, i), ...cards.slice(i + 1)];
      for (const perm of permutations(remaining, length - 1)) {
        yield [cards[i], ...perm];
      }
    }
  }

  for (const sequence of permutations(availableCards, Math.min(count, availableCards.length))) {
    combinationsChecked++;
    if (combinationsChecked > maxCombinations) break;

    const result = simulateCardSequence(state, player, sequence);
    const score = evaluatePosition(state, result, player);

    if (score > bestScore) {
      bestScore = score;
      bestSequence = sequence;
    }
  }

  // Pad with nulls if we couldn't fill all registers
  while (bestSequence.length < count) {
    bestSequence.push(null as unknown as Card);
  }

  return bestSequence;
}
