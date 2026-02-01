import { Card, CardType, DamageCardType, CARD_DISTRIBUTION, PERSONAL_DECK_DISTRIBUTION, DAMAGE_DECK_DISTRIBUTION, PRIORITY_RANGES } from '@circuit-chaos/shared';

// Types that have priority ranges (legacy 2016 rules)
type LegacyCardType = keyof typeof PRIORITY_RANGES;

/**
 * Creates a shared deck (legacy 2016 rules)
 */
export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const [type, count] of Object.entries(CARD_DISTRIBUTION)) {
    const cardType = type as LegacyCardType;
    const range = PRIORITY_RANGES[cardType];
    const step = (range.max - range.min) / (count - 1);

    for (let i = 0; i < count; i++) {
      deck.push({
        id: crypto.randomUUID(),
        type: cardType,
        priority: Math.round(range.min + step * i),
      });
    }
  }

  return shuffle(deck);
}

/**
 * Creates a personal 20-card deck (2023 rules)
 */
export function createPersonalDeck(): Card[] {
  const deck: Card[] = [];

  for (const [type, count] of Object.entries(PERSONAL_DECK_DISTRIBUTION)) {
    const cardType = type as CardType;

    for (let i = 0; i < count; i++) {
      deck.push({
        id: crypto.randomUUID(),
        type: cardType,
        priority: 0, // Priority not used in 2023 rules (clockwise order)
      });
    }
  }

  return shuffle(deck);
}

/**
 * Creates the shared damage deck (2023 rules) - 40 cards
 */
export function createDamageDeck(): Card[] {
  const deck: Card[] = [];

  for (const [type, count] of Object.entries(DAMAGE_DECK_DISTRIBUTION)) {
    const cardType = type as DamageCardType;

    for (let i = 0; i < count; i++) {
      deck.push({
        id: crypto.randomUUID(),
        type: cardType,
        priority: 0, // Priority not used for damage cards
      });
    }
  }

  return shuffle(deck);
}

export function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function dealCards(deck: Card[], count: number): Card[] {
  return deck.splice(0, Math.min(count, deck.length));
}
