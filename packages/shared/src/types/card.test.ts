import { describe, it, expect } from 'vitest';
import { getCardLabel, CardType } from './card';

describe('getCardLabel', () => {
  it('returns correct label for movement cards', () => {
    expect(getCardLabel('move1')).toBe('Move 1');
    expect(getCardLabel('move2')).toBe('Move 2');
    expect(getCardLabel('move3')).toBe('Move 3');
    expect(getCardLabel('backup')).toBe('Back Up');
  });

  it('returns correct label for rotation cards', () => {
    expect(getCardLabel('rotateLeft')).toBe('Turn Left');
    expect(getCardLabel('rotateRight')).toBe('Turn Right');
    expect(getCardLabel('uturn')).toBe('U-Turn');
  });
});
