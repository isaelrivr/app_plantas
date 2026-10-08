import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';

/**
 * SettingsContext
 *
 * Preferencias del usuario: tema, idioma, notificaciones y estado de onboarding.
 *
 * NOTA: la persistencia es en memoria (mock). Para persistir entre sesiones
 * instala @react-native-async-storage/async-storage y guarda/lee este objeto,
 * o sincronízalo con Firestore en users/{uid}/settings.
 *
 * IDIOMA: se guarda la preferencia; el diccionario completo de traducciones se
 * centralizaría en un i18n (p. ej. i18n-js). Aquí queda el scaffolding listo.
 */

export type ThemePreference = 'system' | 'light' | 'dark';
export type AppLanguage = 'es' | 'en';

export const LANGUAGES: { code: AppLanguage; label: string }[] = [
  { code: 'es', label: 'Español' },
  { code: 'en', label: 'English' },
];

interface SettingsContextType {
  themePreference: ThemePreference;
  language: AppLanguage;
  notificationsEnabled: boolean;
  hasOnboarded: boolean;
  resolvedScheme: 'light' | 'dark';
  setThemePreference: (value: ThemePreference) => void;
  setLanguage: (value: AppLanguage) => void;
  setNotificationsEnabled: (value: boolean) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  resetSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [themePreference, setThemePreference] = useState<ThemePreference>('system');
  const [language, setLanguage] = useState<AppLanguage>('es');
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);
  const [hasOnboarded, setHasOnboarded] = useState<boolean>(false);

  const resolvedScheme: 'light' | 'dark' =
    themePreference === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : themePreference;

  const value = useMemo<SettingsContextType>(
    () => ({
      themePreference,
      language,
      notificationsEnabled,
      hasOnboarded,
      resolvedScheme,
      setThemePreference,
      setLanguage,
      setNotificationsEnabled,
      completeOnboarding: () => setHasOnboarded(true),
      resetOnboarding: () => setHasOnboarded(false),
      resetSettings: () => {
        setThemePreference('system');
        setLanguage('es');
        setNotificationsEnabled(true);
      },
    }),
    [themePreference, language, notificationsEnabled, hasOnboarded, resolvedScheme]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

/** Devuelve las preferencias o valores por defecto si no hay provider (seguro). */
export function useSettings(): SettingsContextType {
  const context = useContext(SettingsContext);
  const systemScheme = useColorScheme();
  if (!context) {
    const fallbackScheme: 'light' | 'dark' = systemScheme === 'dark' ? 'dark' : 'light';
    return {
      themePreference: 'system',
      language: 'es',
      notificationsEnabled: true,
      hasOnboarded: false,
      resolvedScheme: fallbackScheme,
      setThemePreference: () => {},
      setLanguage: () => {},
      setNotificationsEnabled: () => {},
      completeOnboarding: () => {},
      resetOnboarding: () => {},
      resetSettings: () => {},
    };
  }
  return context;
}
