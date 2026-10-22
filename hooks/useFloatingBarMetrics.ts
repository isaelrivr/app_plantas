import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  calculateFloatingBarMetrics,
  FloatingBarMetrics,
  FloatingBarMetricsOptions,
} from '../utils/layoutMetrics';

export * from '../utils/layoutMetrics';

export function useFloatingBarMetrics(options?: FloatingBarMetricsOptions): FloatingBarMetrics {
  const insets = useSafeAreaInsets();
  const hasTabBar = options?.hasTabBar ?? true;

  return calculateFloatingBarMetrics(insets.bottom, hasTabBar, Platform.OS);
}
