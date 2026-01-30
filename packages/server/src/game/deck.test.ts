import { describe, it, expect } from 'vitest';
import { createDeck, shuffle, dealCards } from './deck';
import { CARD_DISTRIBUTION } from '@circuit-chaos/shared';

describe('createDeck', () => {
  it('creates correct total number of cards', () => {
    const deck = createDeck();
    const expectedTotal = Object.values(CARD_DISTRIBUTION).reduce((a, b) => a + b, 0);

    expect(deck.length).toBe(expectedTotal);
  });

  it('contains correct number of each card type', () => {
    const deck = createDeck();

    for (const [type, count] of Object.entries(CARD_DISTRIBUTION)) {
      const cardsOfType = deck.filter(c => c.type === type);
      expect(cardsOfType.length).toBe(count);
    }
  });

  it('assigns unique IDs to all cards', () => {
    const deck = createDeck();
    const ids = deck.map(c => c.id);
    const uniqueIds = new Set(ids);

    expect(uniqueIds.size).toBe(deck.length);
  });

  it('assigns priorities within valid ranges', () => {
    const deck = createDeck();

    for (const card of deck) {
      expect(card.priority).toBeGreaterThanOrEqual(10);
      expect(card.priority).toBeLessThanOrEqual(840);
    }
  });
});

describe('shuffle', () => {
  it('returns array of same length', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle(original);

    expect(shuffled.length).toBe(original.length);
  });

  it('contains all original elements', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle(original);

    expect(shuffled.sort()).toEqual(original.sort());
  });

  it('does not modify original array', () => {
    const original = [1, 2, 3, 4, 5];
    const copy = [...original];
    shuffle(original);

    expect(original).toEqual(copy);
  });
});

describe('dealCards', () => {
  it('removes cards from deck', () => {
    const deck = createDeck();
    const originalLength = deck.length;

    dealCards(deck, 5);

    expect(deck.length).toBe(originalLength - 5);
  });

  it('returns requested number of cards', () => {
    const deck = createDeck();
    const hand = dealCards(deck, 9);

    expect(hand.length).toBe(9);
  });

  it('returns remaining cards if deck is smaller than requested', () => {
    const deck = createDeck();
    // Deal most of the deck first
    dealCards(deck, 80);
    const remaining = deck.length;

    const hand = dealCards(deck, 10);

    expect(hand.length).toBe(remaining);
  });
});
