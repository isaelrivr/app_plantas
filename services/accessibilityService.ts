/**
 * Accessibility Service
 *
 * Provee utilidades para lectores de pantalla (TalkBack en Android, VoiceOver en iOS)
 * y detección del estado de "Reducir movimiento" del sistema operativo.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/**
 * Anuncia un mensaje para usuarios de TalkBack o VoiceOver.
 * Se añade un breve retardo para asegurar que la vista haya terminado transiciones.
 */
export function announce(message: string, delayMs = 150): void {
  if (!message) return;
  setTimeout(() => {
    try {
      AccessibilityInfo.announceForAccessibility(message);
    } catch {
      // Entornos de prueba o sin lector de pantalla activo
    }
  }, delayMs);
}

/**
 * Hook para detectar si el usuario tiene activado "Reducir movimiento" en los ajustes del sistema.
 */
export function useReduceMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    let active = true;

    // Consulta inicial
    AccessibilityInfo.isReduceMotionEnabled()
      .then((enabled) => {
        if (active) setReduceMotion(enabled);
      })
      .catch(() => {});

    // Suscripción a cambios
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (enabled: boolean) => {
        if (active) setReduceMotion(enabled);
      }
    );

    return () => {
      active = false;
      subscription?.remove?.();
    };
  }, []);

  return reduceMotion;
}
