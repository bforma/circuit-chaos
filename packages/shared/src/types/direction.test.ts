import { describe, it, expect } from 'vitest';
import { rotateDirection, getDirectionDelta, DIRECTIONS } from './direction';

describe('rotateDirection', () => {
  it('rotates clockwise correctly', () => {
    expect(rotateDirection('north', 'cw')).toBe('east');
    expect(rotateDirection('east', 'cw')).toBe('south');
    expect(rotateDirection('south', 'cw')).toBe('west');
    expect(rotateDirection('west', 'cw')).toBe('north');
  });

  it('rotates counter-clockwise correctly', () => {
    expect(rotateDirection('north', 'ccw')).toBe('west');
    expect(rotateDirection('west', 'ccw')).toBe('south');
    expect(rotateDirection('south', 'ccw')).toBe('east');
    expect(rotateDirection('east', 'ccw')).toBe('north');
  });

  it('performs u-turn correctly', () => {
    expect(rotateDirection('north', 'uturn')).toBe('south');
    expect(rotateDirection('east', 'uturn')).toBe('west');
    expect(rotateDirection('south', 'uturn')).toBe('north');
    expect(rotateDirection('west', 'uturn')).toBe('east');
  });
});

describe('getDirectionDelta', () => {
  it('returns correct delta for north', () => {
    expect(getDirectionDelta('north')).toEqual({ dx: 0, dy: -1 });
  });

  it('returns correct delta for south', () => {
    expect(getDirectionDelta('south')).toEqual({ dx: 0, dy: 1 });
  });

  it('returns correct delta for east', () => {
    expect(getDirectionDelta('east')).toEqual({ dx: 1, dy: 0 });
  });

  it('returns correct delta for west', () => {
    expect(getDirectionDelta('west')).toEqual({ dx: -1, dy: 0 });
  });
});

describe('DIRECTIONS', () => {
  it('contains all four directions in order', () => {
    expect(DIRECTIONS).toEqual(['north', 'east', 'south', 'west']);
  });
});
