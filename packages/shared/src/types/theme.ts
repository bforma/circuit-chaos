export type ThemeId =
  | 'industrial'
  | 'candy'
  | 'neon'
  | 'nature'
  | 'space'
  | 'ocean'
  | 'lava'
  | 'ice'
  | 'jungle'
  | 'steampunk';

export interface ThemeInfo {
  id: ThemeId;
  name: string;
  description: string;
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'industrial',
    name: 'Industrial',
    description: 'Dark metal factory with warning stripes',
  },
  {
    id: 'candy',
    name: 'Candy',
    description: 'Sweet pink and colorful candy land',
  },
  {
    id: 'neon',
    name: 'Neon',
    description: 'Cyberpunk arcade with glowing lights',
  },
  {
    id: 'nature',
    name: 'Nature',
    description: 'Forest floor with wooden elements',
  },
  {
    id: 'space',
    name: 'Space',
    description: 'Space station with metallic panels',
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Underwater world with coral and sand',
  },
  {
    id: 'lava',
    name: 'Lava',
    description: 'Volcanic terrain with molten rock',
  },
  {
    id: 'ice',
    name: 'Ice',
    description: 'Frozen arctic with crystal formations',
  },
  {
    id: 'jungle',
    name: 'Jungle',
    description: 'Ancient temple ruins in the jungle',
  },
  {
    id: 'steampunk',
    name: 'Steampunk',
    description: 'Victorian brass and copper machinery',
  },
];

export const DEFAULT_THEME: ThemeId = 'industrial';
