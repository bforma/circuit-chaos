export type CardType =
  | 'move1'
  | 'move2'
  | 'move3'
  | 'backup'
  | 'rotateLeft'
  | 'rotateRight'
  | 'uturn'
  | 'powerUp'
  | 'again';

export interface Card {
  id: string;
  type: CardType;
  priority: number;
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
  }
}
