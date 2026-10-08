import { colors, ThemeColors } from './colors';
import { typography } from './typography';
import { spacing, layout } from './spacing';
import { motion } from './motion';
import { useSettings } from '../context/SettingsContext';

export interface Theme {
  isDark: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  motion: typeof motion;
}

export function useAppTheme(): Theme {
  const { resolvedScheme } = useSettings();
  const isDark = resolvedScheme === 'dark';

  return {
    isDark,
    colors: isDark ? colors.dark : colors.light,
    typography,
    spacing,
    layout,
    motion,
  };
}
