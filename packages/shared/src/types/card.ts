export type CardType =
  | 'move1'
  | 'move2'
  | 'move3'
  | 'backup'
  | 'rotateLeft'
  | 'rotateRight'
  | 'uturn';

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
  }
}
