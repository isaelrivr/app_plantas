import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './AppNavigator';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

/**
 * Determina si la ruta activa actual corresponde a una pantalla con barra
 * inferior de navegación flotante (tabs).
 */
export function isCurrentRouteInTabs(): boolean {
  if (!navigationRef.isReady()) return true;
  const current = navigationRef.getCurrentRoute();
  if (!current) return true;
  // Rutas que muestran la barra de navegación inferior flotante
  const tabScreens = ['Today', 'Garden', 'Scan', 'Explore', 'Profile', 'MainTabs'];
  return tabScreens.includes(current.name);
}
