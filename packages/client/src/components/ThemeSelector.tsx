import { useMemo } from 'react';
import type { ThemeId } from '@circuit-chaos/shared';
import { THEMES } from '@circuit-chaos/shared';
import styles from './ThemeSelector.module.css';

// Theme preview tiles - one floor tile per theme
const themePreviewImages: Record<ThemeId, string> = {
  industrial: new URL('../assets/themes/industrial/floor.svg', import.meta.url).href,
  candy: new URL('../assets/themes/candy/floor.svg', import.meta.url).href,
  neon: new URL('../assets/themes/neon/floor.svg', import.meta.url).href,
  nature: new URL('../assets/themes/nature/floor.svg', import.meta.url).href,
  space: new URL('../assets/themes/space/floor.svg', import.meta.url).href,
  ocean: new URL('../assets/themes/ocean/floor.svg', import.meta.url).href,
  lava: new URL('../assets/themes/lava/floor.svg', import.meta.url).href,
  ice: new URL('../assets/themes/ice/floor.svg', import.meta.url).href,
  jungle: new URL('../assets/themes/jungle/floor.svg', import.meta.url).href,
  steampunk: new URL('../assets/themes/steampunk/floor.svg', import.meta.url).href,
};

interface Props {
  selectedTheme: ThemeId;
  onThemeChange: (theme: ThemeId) => void;
  disabled?: boolean;
}

export function ThemeSelector({ selectedTheme, onThemeChange, disabled }: Props) {
  const themeOptions = useMemo(() => {
    return THEMES.map((theme) => ({
      ...theme,
      previewImage: themePreviewImages[theme.id],
    }));
  }, []);

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>Board Theme</h3>
      <div className={styles.grid}>
        {themeOptions.map((theme) => (
          <button
            key={theme.id}
            className={`${styles.themeCard} ${
              selectedTheme === theme.id ? styles.selected : ''
            }`}
            onClick={() => onThemeChange(theme.id)}
            disabled={disabled}
            title={theme.description}
          >
            <div className={styles.preview}>
              <img
                src={theme.previewImage}
                alt={theme.name}
                className={styles.previewImage}
              />
            </div>
            <div className={styles.info}>
              <span className={styles.name}>{theme.name}</span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
