import { colors, ThemeColors } from './colors';
import { typography, easyModeTypography } from './typography';
import { spacing, layout } from './spacing';
import { standardMotion, reducedMotion } from './motion';
import { useSettings } from '../context/SettingsContext';
import { useReduceMotion } from '../services/accessibilityService';

export interface Theme {
  isDark: boolean;
  easyMode: boolean;
  colors: ThemeColors;
  typography: typeof typography;
  spacing: typeof spacing;
  layout: typeof layout;
  motion: typeof standardMotion;
}

export function useAppTheme(): Theme {
  const { resolvedScheme, easyMode } = useSettings();
  const systemReducedMotion = useReduceMotion();
  const isDark = resolvedScheme === 'dark';

  const isMotionReduced = systemReducedMotion || easyMode;

  const activeTypography = easyMode ? easyModeTypography : typography;
  const activeLayout = easyMode
    ? {
        ...layout,
        minTouchTarget: layout.easyMinTouchTarget,
        cardPadding: 18,
        screenPadding: 18,
      }
    : layout;

  return {
    isDark,
    easyMode,
    colors: isDark ? colors.dark : colors.light,
    typography: activeTypography,
    spacing,
    layout: activeLayout,
    motion: isMotionReduced ? reducedMotion : standardMotion,
  };
}
