import { Card, CardType, CARD_DISTRIBUTION, PRIORITY_RANGES } from '@circuit-chaos/shared';

export function createDeck(): Card[] {
  const deck: Card[] = [];

  for (const [type, count] of Object.entries(CARD_DISTRIBUTION)) {
    const cardType = type as CardType;
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
