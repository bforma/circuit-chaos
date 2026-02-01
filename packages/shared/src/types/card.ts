// Programming card types (in personal decks)
export type ProgrammingCardType =
  | 'move1'
  | 'move2'
  | 'move3'
  | 'backup'
  | 'rotateLeft'
  | 'rotateRight'
  | 'uturn'
  | 'powerUp'
  | 'again';

// Damage card types (in shared damage deck)
export type DamageCardType =
  | 'spam'
  | 'haywireMove1RotateMove1'    // Move 1, Rotate Right, Move 1
  | 'haywireMove2Sideways'        // Move 2 left or right
  | 'haywireMove3Uturn';          // Move 3, U-Turn

// All card types
export type CardType = ProgrammingCardType | DamageCardType;

export interface Card {
  id: string;
  type: CardType;
  priority: number;
}

// Check if a card is a damage card
export function isDamageCard(type: CardType): type is DamageCardType {
  return type === 'spam' ||
    type === 'haywireMove1RotateMove1' ||
    type === 'haywireMove2Sideways' ||
    type === 'haywireMove3Uturn';
}

// Check if a card is a haywire card
export function isHaywireCard(type: CardType): boolean {
  return type.startsWith('haywire');
}

export function getCardLabel(type: CardType): string {
  switch (type) {
    case 'move1': return 'Move 1';
    case 'move2': return 'Move 2';
    case 'move3': return 'Move 3';
    case 'backup': return 'Back Up';
    case 'rotateLeft': return 'Turn Left';
    case 'rotateRight': return 'Turn Right';
    case 'uturn': return 'U-Turn';
    case 'powerUp': return 'Power Up';
    case 'again': return 'Again';
    // Damage cards
    case 'spam': return 'SPAM';
    case 'haywireMove1RotateMove1': return 'Haywire';
    case 'haywireMove2Sideways': return 'Haywire';
    case 'haywireMove3Uturn': return 'Haywire';
  }
}

export function getCardIcon(type: CardType): string {
  switch (type) {
    case 'move1': return '↑';
    case 'move2': return '⇈';
    case 'move3': return '⤊';
    case 'backup': return '↓';
    case 'rotateLeft': return '↺';
    case 'rotateRight': return '↻';
    case 'uturn': return '↩';
    case 'powerUp': return '⚡';
    case 'again': return '🔄';
    // Damage cards
    case 'spam': return '🗑️';
    case 'haywireMove1RotateMove1': return '⚠️';
    case 'haywireMove2Sideways': return '⚠️';
    case 'haywireMove3Uturn': return '⚠️';
  }
}

export function getHaywireDescription(type: DamageCardType): string {
  switch (type) {
    case 'spam': return 'Discard and draw replacement';
    case 'haywireMove1RotateMove1': return 'Move 1, Rotate Right, Move 1';
    case 'haywireMove2Sideways': return 'Move 2 sideways (left or right)';
    case 'haywireMove3Uturn': return 'Move 3, then U-Turn';
  }
}
